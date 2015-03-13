# GValidator Form Validation Library #

## Introduction ##
GValidator is a lightweight javascript form validation library that automatically adds client-side validation to form elements, without needing to write a single line of javascript.

The aims of the project are to provide the following:
  * A user-friendly experience
  * A reusable and lightweight library
  * Semantically clean code
  * Web Standards compliant code
  * Cross browser compatibility
  * Code flexibility and extensibility
  * Promote adoption via ease of use

To use the library without customization, all you need to do is include it.

Other features:
  * Easy Internationalization
  * Simple plug-in mechanism for new validators, should you want to extend functionality
  * Easily configurable
  * No dependencies on other libraries such as JQuery, Mootools etc.

## Examples and Demos ##
Take a look at our [working examples](http://www.onegeek.com.au/articles/programming/javascript-form-validation.php#example)

## Documentation ##
Find more about GValidator, including the design and documentation at [http://www.onegeek.com.au/articles/programming/javascript-form-validation.php](http://www.onegeek.com.au/articles/programming/javascript-form-validation.php)

## Latest Changes ##
### Version 0.5.90 ###
Latest stable release:

  * Minor bug fix for single checkbox forms.

### Version 0.5.88 ###

  * Fixed issue where onsubmit event was being overridden by GValidator  ([issue 21](https://code.google.com/p/gvalidator/issues/detail?id=21))
  * Released a number of further hooks into GValidator system ([issue 18](https://code.google.com/p/gvalidator/issues/detail?id=18)). Examples:

```
f = gvalidator.getGForm('autoform'); // Change to your form id
el = f.getFieldByName('firstname') //  Change to the element name
```

### Version 0.5.83 ###

  * Fixed critical issue in Safari ([issue 15](https://code.google.com/p/gvalidator/issues/detail?id=15))
  * Updated license to LGPL for commercial use

### Version 0.5.81 ###
 Note: This version should NOT be downloaded, it contains a critical issue in Safari ([issue 15](https://code.google.com/p/gvalidator/issues/detail?id=15)). 

  * Fixed [issue 14](https://code.google.com/p/gvalidator/issues/detail?id=14)
  * Added password\confirm password with strong password validation

### Version 0.5.77 ###
Bug fixes for IE{6,7,8}.

### Version 0.5.59 ###
This release was mainly to fix a few bugs, code cleanup/refactor, and documentation frenzy (see new API Doc downloads).

### Version 0.5.49 ###

Major updates include:
  * Internationalisation and translation file support added.
  * Easy configuration, and form specific configuration via class names and id's
  * Simple plugin file support
  * Empty fields now have separate error messages
  * Form level validation can be passed to a function handler via configuration
  * Form level validation errors can be displayed in a container div via a configuration option
  * Element level parameters added
  * DEPRECATION of the following params
    * ENABLE\_COMPACT\_MESSAGES (replace with config option eMsgFormat: 'compact')
    * ICON**_(replaced by config options icons: {error: 'image/path', info...} )_

### Version 0.4.30 ###**

  * Bug fix ([Issue 4](https://code.google.com/p/gvalidator/issues/detail?id=4)). Generic text field did not take 'required' flag into consideration, and is now more closely related to AbstractTextField, in that it has a universal 'this.regex' predicate.


### Version 0.4.25 ###

  * GValidator now resets along with a native DOM form reset.

### Version 0.4.20 ###

  * Ability to set a field as required using html class 'required'.
  * Ability to add multiple class names to a field without interupting GValidator.