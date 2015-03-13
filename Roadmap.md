# Roadmap #

Currently, GValidator is a stand-alone library with no dependencies on any other library. I would like to keep it this way as much as possible, but there is a possibility of making a Mootools port which would be much more lightweight for Mootools adopters.

## Feature Wish list ##
  * Better event handling, and custom event hooks thrown during validation cycle
  * Ability to specify formatting mask options (Currency, decimals spring to mind) and have the data aligned to the specification i.e. `$__,__.__` or something similar
  * Configuration based validation rules (see below)

## Recently completed features ##
  * Set required/not-required using class 'required'
  * Ability to add multiple class names to a field
  * Ability to tailor how messages are displayed on a given field, such as specifying a container for all message, inline, using different elements etc.
  * Internationalization of error messages
  * Templated message types with custom messages (i.e. different templates messages for EMPTY, INVALID... fields)
  * Configuration parameters separated from main code base

## Incubator ##

### Extensibility Enhancement - Complete ###
Promote extensibility via a cleaner extension mechanism; GValidator could look for a particular file based on convention for its add-ons i.e. gvalidator-extensions.js|xml|txt

This file could be an associative array, object, or property-like, to enable the creation of simple validation rules, without needing to know anything more than basic JS.

For example, to create a new validation 'type' for an 'IP address' field, the file might be something like the following:

**JS Example**
```
ONEGEEK.forms.GValidator.plugin = {
    ip4address: {
        _extends:     'AbstractTextField',
        regex:        '/^\b(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b$/',
        cleanRegex:   '/[^0-9\.]/',
        errorMessage: 'Please enter a valid IP 4 Address i.e. 127.0.0.1',
        validate: function() {
          // Do something to validate the field
        }
      
    },
    anotherClass: {
                
    }    
};
```

### Rules Based Validation via Configuration ###
Form validation is often dependent on user choices, for example, a form may ask the user a segmentation question at the beginning which will then disclose certain related fields. In this case, some fields become required and others will become hidden and are not required.

GValidator could potentially read in from a config file (similar to the one proposed above) triggered by a class name at the form level, which contains the validation rules for different user choices.

Following this same concept, it is entirely possible to build a framework that will fire off events to change the display and perform other logical functions on user actions.

If this were made flexible enough, it could mean that the presentation, validation and user-flow layers be separated and controlled simply by means of configuration. Nice.