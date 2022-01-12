# frozen_string_literal: true

require "yaml"

# :nodoc:
module Primer
  class Classify
    # Handler for PrimerCSS utility classes loaded from utilities.rake
    class Utilities
      # Load the utilities.yml file.
      # Disabling because we want to load symbols, strings, and integers from the .yml file
      # rubocop:disable Security/YAMLLoad
      UTILITIES = YAML.load(
        File.read(
          File.join(File.dirname(__FILE__), "./utilities.yml")
        )
      ).freeze
      # rubocop:enable Security/YAMLLoad

      BREAKPOINTS = ["", "-sm", "-md", "-lg", "-xl"].freeze

      SUPPORTED_KEY_CACHE = Hash.new { |h, k| h[k] = !UTILITIES[k].nil? }
      BREAKPOINT_INDEX_CACHE = Hash.new { |h, k| h[k] = BREAKPOINTS.index(k) }

      class << self
        attr_accessor :validate_class_names, :supported_selector_exemptions
        alias validate_class_names? validate_class_names

        def classname(key, val, breakpoint = "")
          # For cases when `argument: false` is passed in, treat like we would nil
          return nil unless val

          if (valid = validate(key, val, breakpoint))
            valid
          else
            # Get selector
            UTILITIES[key][val][BREAKPOINT_INDEX_CACHE[breakpoint]]
          end
        end

        # Does the Utility class support the given key
        #
        # returns Boolean
        def supported_key?(key)
          SUPPORTED_KEY_CACHE[key]
        end

        # Does the Utility class support the given key and value
        #
        # returns Boolean
        def supported_value?(key, val)
          supported_key?(key) && !UTILITIES[key][val].nil?
        end

        # Does the given selector exist in the utilities file
        #
        # returns Boolean
        def supported_selector?(selector)
          # This method is too slow to run in production
          return false unless validate_class_names?

          find_selector(selector).present?
        end

        # Does the given selector have a configured exemption.
        #
        # returns Boolean
        def supported_selector_exemption?(selector)
          return false unless supported_selector_exemptions

          exemptions = Array(supported_selector_exemptions)
          exemptions.include?(selector)
        end

        # Is the key and value responsive
        #
        # returns Boolean
        def responsive?(key, val)
          supported_value?(key, val) && UTILITIES[key][val].count > 1
        end

        # Get the options for the given key
        #
        # returns Array or nil if key not supported
        def mappings(key)
          return unless supported_key?(key)

          UTILITIES[key].keys
        end

        # Extract hash from classes ie. "mr-1 mb-2 foo" => { mr: 1, mb: 2, classes: "foo" }
        def classes_to_hash(classes)
          # This method is too slow to run in production
          return { classes: classes } unless validate_class_names?

          obj = {}
          classes = classes.split
          # Loop through all classes supplied and reject ones we find a match for
          # So when we're at the end of the loop we have classes left with any non-system classes.
          classes.reject! do |classname|
            key, value, index = find_selector(classname)
            next false if key.nil?

            # Create array if nil
            obj[key] = Array.new(5, nil) if obj[key].nil?
            # Place the arguments in the responsive array based on index mr: [nil, 2]
            obj[key][index] = value
            next true
          end

          # Transform responsive arrays into arrays without trailing nil, so `mr: [1, nil, nil, nil, nil]` becomes `mr: 1`
          obj.transform_values! do |value|
            value = value.reverse.drop_while(&:nil?).reverse
            if value.count == 1
              value.first
            else
              value
            end
          end

          # Add back the non-system classes
          obj[:classes] = classes.join(" ") if classes.any?
          obj
        end

        def classes_to_args(classes)
          hash_to_args(classes_to_hash(classes))
        end

        def hash_to_args(hash)
          hash.map do |key, value|
            val = case value
                  when Symbol
                    ":#{value}"
                  when String
                    value.to_json
                  else
                    value
                  end

            "#{key}: #{val}"
          end.join(", ")
        end

        def validate(key, val, breakpoint)
          unless supported_key?(key)
            raise ArgumentError, "#{key} is not a valid Primer utility key" if validate_class_names?

            return ""
          end

          unless breakpoint.empty? || responsive?(key, val)
            raise ArgumentError, "#{key} does not support responsive values" if validate_class_names?

            return ""
          end

          unless supported_value?(key, val)
            raise ArgumentError, "#{val} is not a valid value for :#{key}. Use one of #{mappings(key)}" if validate_class_names?

            return nil if [true, false].include?(val)

            return "#{key.to_s.dasherize}-#{val.to_s.dasherize}"
          end

          nil
        end

        private

        def find_selector(selector)
          # Build hash indexed on the selector for fast lookup.
          @selector_cache ||= UTILITIES.each_with_object({}) do |(keyword, argument_w_selectors), dict|
            argument_w_selectors.each do |argument, selectors|
              selectors.each_with_index do |css_selector, index|
                dict[css_selector] = [keyword, argument, index]
              end
            end
          end
          @selector_cache[selector]
        end
      end
    end
  end
end
