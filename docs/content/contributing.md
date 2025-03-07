---
title: Contributing
---

Hi there! We're thrilled that you'd like to contribute to this project. Your help is essential for keeping it great.

If you have any substantial changes that you would like to make, please [open an issue](http://github.com/primer/view_components/issues/new) first to discuss them with us.

Contributions to this project are [released](https://help.github.com/articles/github-terms-of-service/#6-contributions-under-repository-license) to the public under the [project's open source license](LICENSE.txt).

Please note that this project is released with a [Contributor Code of Conduct](CODE_OF_CONDUCT.md). By participating in this project you agree to abide by its terms.

## Adding a new component

Use the provided generator to create a component:

```sh
bundle exec thor component_generator my_component_name
```

To declare a dependency on an `npm` package, pass `js` to the generator:

```sh
bundle exec thor component_generator my_component_name --js=some-npm-package-name
```

### Tag considerations

Components and slots should restrict which HTML tags they will render. For example, an `Image` component should never be rendered as an `<h1>`.

Consider which HTML tags make sense. Components typically fall under one of the following patterns:

1) Fixed tag that cannot be updated by the consumer:

```rb
system_arguments[:tag] = :h1
```

2) Allowed list of tags that are set with the `tag:` argument using the `fetch_or_fallback` helper.

```rb
system_arguments[:tag] = fetch_or_fallback(TAG_OPTIONS, tag, DEFAULT_TAG)
```

## Testing

Before running the whole test suite with: `script/test`, you must run `bundle exec rake docs:preview`.

Run a subset of tests by supplying arguments to `script/test`:

1. `script/test FILE` runs all tests in the file.
1. `script/test FILE:LINE` runs test in specific line of the file.
1. `script/test 'GLOB'` runs all tests for matching glob.
    * make sure to wrap the `GLOB` in single quotes `''`.

### System tests

Primer ViewComponents utilizes Cuprite for system testing components that rely on JavaScript functionality.

By default, the system tests run in a headless Chrome browser. Prefix the test command with `HEADLESS=false` to run the system tests in a normal browser.

## Writing documentation

Documentation is written as [YARD](https://yardoc.org/) comments directly in the source code, compiled into Markdown via `rake docs:build` and served by [Doctocat](https://github.com/primer/doctocat).

### Storybook / Documentation / Demo Rails App

To run Storybook, the documentation site, and the demo app, run:

```bash
script/dev
```

See the demo app at `/rails/view_components/` in your browser.
To rerender the templates, you do not have to restart the server. Run this command and refresh the page.

```bash
bundle exec rake docs:preview
```

_Note: Overmind is required to run script/dev._

## Developing with another app

In your `Gemfile`, change:

```ruby
gem "primer_view_components"
```

to

```ruby
gem "primer_view_components", path: "path_to_the_gem" # e.g. path: "~/primer/view_components"
```

Then, `bundle install` to update references. You'll now be able to see changes from the gem without having to build it.
Remember that restarting the Rails server is necessary to see changes, as the gem is loaded at boot time.

To minimize the number of restarts, we recommend checking the component in Storybook first, and then when it's in a good state, you can check it in your app.

## Submitting a pull request

0. [Fork](https://github.com/primer/view_components/fork) and clone the repository
0. Configure and install the dependencies: `./script/setup`
0. Make sure the tests pass on your machine
0. Create a new branch: `git checkout -b my-branch-name`
0. Make your change, add tests, and make sure the tests still pass
0. Add an entry to the top of `CHANGELOG.md` for your change under the appropriate heading
0. Push to your fork and [submit a pull request](https://github.com/primer/view_components/compare)
0. Pat yourself on the back and wait for your pull request to be reviewed and merged.

Here are a few things you can do that will increase the likelihood of your pull request being accepted:

* Write tests.
* Write [YARD comments](https://yardoc.org/) for component and slot initializers. Please document the purpose and general use of new components or slots you add, as well as the parameters they accept. See for example the comment style in app/components/primer/counter_component.rb.
* Add new components to the `components` list in Rakefile in the `docs:build` task, so that Markdown documentation is generated for them within docs/content/components/.
* Keep your change as focused as possible. If there are multiple changes you would like to make that are not dependent upon each other, consider submitting them as separate pull requests.
* Write a descriptive pull request message.

## Deploying to Heroku

We have both `staging` and `production` environments. To deploy Storybook to Heroku, run the following in `#primer-view-components-ops`:

```bash
.deploy primer-view-components</branch> to <environment>
```

If no `branch` is passed, `main` will be deployed.

## Publishing a Release

To publish a release, you must have an account on [rubygems](https://rubygems.org/) and [npmjs](https://www.npmjs.com/). Additionally, you must have been added as a maintainer
to the project. Please verify that you have 2FA enabled on both accounts.

1. Make sure you are on the main branch and have pulled in the latest changes.
1. Run `script/release` and follow the instructions.
1. Once your release PR has been approved and merged, run `script/publish`. You may be prompted to log into your rubygem and npm account.
1. Lastly, draft a new release from the [releases page](https://github.com/primer/view_components/releases). The tag version should be updated to the newest version. The description should be updated to the relevant CHANGELOG descriptions. Press the `Publish release` button and you're good to go!
