// /////////////////////////////////////////////////////////////////////////////////
// GValidator - JavaScript Form Validation Library
// 
// Author       - Matt Fellows, OneGeek Software (http://www.onegeek.com.au)
// License      - GNU Public License v3 (license.txt)
// Version      - $Rev$
// Dependancies - none
// /////////////////////////////////////////////////////////////////////////////////

// /////////////////////////////////////////////////////////////////////////////////
// Package ONEGEEK  
// /////////////////////////////////////////////////////////////////////////////////

/**
 * Create the ONEGEEK global namespace object
 */
if (typeof (ONEGEEK) == "undefined") {
  /**
   * The ONEGEEK global namespace object. If ONEGEEK is already defined, the existing ONEGEEK object will not be overwritten so that defined namespaces are preserved.
   * 
   * @class ONEGEEK
   * @static
   */
  ONEGEEK = {};
}

// /////////////////////////////////////////////////////////////////////////////////
// Package ONEGEEK.forms
// /////////////////////////////////////////////////////////////////////////////////

/**
 * Register the forms package namespace if it doesn't exist
 */
if (typeof ONEGEEK.forms == "undefined") {
  ONEGEEK.forms = {
      // Constants: Edit to suit your environment
      ENABLE_AUTO_FORM_VALIDATION: true,
      ENABLE_COMPACT_MESSAGES: true, // Shows a link to a popup message if true, otherwise always shows the message

      // Image constants
      ICON_ERROR: '../images/icons/cross.png',
      ICON_OK: '../images/icons/tick.png',
      ICON_INFO: '../images/icons/help.png',
      ICON_ALERT: '../images/icons/icon_alert.gif',

      // Field Status Constants
      FIELD_STATUS_ERROR:1,
      FIELD_STATUS_OK: 2,
      FIELD_STATUS_INFO: 3,
      FIELD_STATUS_NONE: 4,      
  };
}

// ///////////////////////////////////////////
// Start DOM Utilities Class Definition //
// ///////////////////////////////////////////

/**
 * General DOM manipulation utilities needed for this library
 */
ONEGEEK.forms.DOMUtilities = function() {
  if(typeof(Array.prototype['inArray']) == 'undefined') {
    Array.prototype.inArray = function(needle) {  
      for (key in this) {
        if (this[key] === needle) {
          return true;
        }
      }
      return false;
    }
  }
    
  /**
   * Get the x and y coordinates of an element relative to the top left corner of the window
   * 
   * @param {Object}
   *          obj The source element
   * @return {Array} An array containing the x,y coords of obj
   */
  this.findPos = function(obj) {
    var curleft = 0;
    var curtop = 0;
    if (obj.offsetParent) {
      do {
        curleft += obj.offsetLeft;
        curtop += obj.offsetTop;
      } while ((obj = obj.offsetParent));
    }
    return [curleft, curtop];
  };

  /**
   * Popup / Hide an element at the location of the click
   * 
   * @param {Object}
   *          source The source element that is sending the request
   * @param {Object}
   *          target The target element to show/hide
   */
  this.togglePopup = function(source, target) {
    var div = target;
    var coords = this.findPos(source);
    if (div.style.display == 'block') {
      div.style.display = 'none';
    } else {
      div.style.position = 'absolute';
      div.style.left = coords[0] + 10 + 'px';
      div.style.top = coords[1] - 6 + 'px';
      div.style.display = 'block';
    }
  };

  /**
   * Check if an element belongs to a certain class
   * 
   * @param {Object}
   *          element The element to check
   * @param {Object}
   *          class The class to check against the element
   */
  this.doesElementBelongToClass = function(element, className) {
    var classes = element.className;
    var pattern = new RegExp(className, 'g');

    if (pattern.test(classes)) {
      return true;
    }
    return false;

  };

  /**
   * Remove a class name from an element
   * 
   * @param {Object}
   *          element The element to check
   * @param {Object}
   *          className The class to remove from the element
   */
  this.removeClass = function(element, className) {
    var classes = element.className;
    var regex = '\b' + className + '\b';
    element.className = classes.replace(className, '');
  };

  /**
   * Add a class name to an element
   * 
   * @param {Object}
   *          element The element to check
   * @param {Object}
   *          class The class to add to the element
   */
  this.addClass = function(element, className) {
    var classes = element.className;

    if (!this.doesElementBelongToClass(element, className)) {
      element.className += " " + className;
    }
  };

  /**
   * Attach an event to an element. Handles for most browsers NB. To make it work in crappy old browsers assign the element an id
   */
  this.addEvent = function(element, event, handler) {
    if (element.attachEvent) { // IE (6+?)
      element.attachEvent('on' + event, handler);
    } else if (element.addEventListener) { // Most nice browsers
      element.addEventListener(event, handler, false);
    } else { // Old browsers
      // Assign an id based on the time for this element if it has no id
      if (!element.id) {
        var date = new Date();
        element.id = date.getTime();
      }
      eval('document.getElementById(' + element.id + ').on' + event + '=' + handler);
    }
  };

};

// Create a global (quasi-singleton) instance of the factory
var util = new ONEGEEK.forms.DOMUtilities();

// ///////////////////////////////////////////
// Start FormField Class Definition //
// ///////////////////////////////////////////

/**
 * Abstract Form Field object. 
 * 
 * Has the necessary functions to access, validate and clean a form elements' data 
 * This class should NOT be instantiated. 
 * Subclass and override these methods
 * 
 * @param DOMElement field   The actual DOM element this object is validating.
 */
ONEGEEK.forms.AbstractFormField = function(field) {
  this.field = field || null; // DOM element
  this.successMessage = 'Completed'; // Messages displayed to user on successful completion
  this.errorMessage = 'Please complete'; // Messages displayed to user on completion error
  this.contextMessage = 'Please complete'; // Messages displayed to user when they are filling out field
  this.messageSpan = null; // The span to display field errors, messages, validation etc.
  this.isRequired = false; // Is this field required?
  this.statusImg = null; // The image for the status icon span
  this.statusLink = null; // The link for the status icon
  this.fieldStatus = null; // The status field span (<span><a><img/></a></span>)
  this.modified = false; // has the field been modified?
  this.className = null; // The class name used for this element, could be many per type
  var propOptions = ['errorMessage', 'successMessage', 'contextMessage', 'regex', 'cleanRegex']; // Options that can be overridden by plugins/translations
  
  /**
   * Override the default options for a class.
   * Used by translation service and plugins.
   */
  this.setOptions = function(options) {
    // Override property values if allowed
    for(item in options) {      
      // Check if option is eligible
      if (propOptions.inArray(item) === true ) {
        this[item] = options[item];
      }
    }
  };
  
  /**
   * Set the class name that this element uses 
   * for validation purposes.
   */
  this.setClassName = function(classname) {
    this.className = classname;
  }
  
  /**
   * Set the language translations for this.
   */
  this.setLang = function(lang) {
        
    // Find translation file
    var options = null;
    try {
      // Join the defaults with the specific class translations
      this.setOptions(ONEGEEK.forms.GValidator.translation[lang]['defaults']);
      this.setOptions(ONEGEEK.forms.GValidator.translation[lang][this.className]);      
    } catch (e) {
      // do nothing, default translation (EN, or 'defaults' should it exist) will kick in
    }    
  };
  
  // Add the Icons, spans and validation events
  this.setup = function() {
    // Check for required class
    if (util.doesElementBelongToClass(this.field, 'required')) {
      this.isRequired = true;
    }
    this.getMessageSpan();
    if (ONEGEEK.forms.ENABLE_COMPACT_MESSAGES) {
      this.createFieldStatusIcon();
    }
    this.createRequiredSpan();
    this.validate();

    // Add events
    util.addEvent(this.field, 'blur', this.applyFieldValidation(this));
    util.addEvent(this.field, 'click', this.applyContextInformation(this));
    util.addEvent(this.field, 'change', this.applyFieldModification(this));
  };
  
  /**
   * Set the parent form. This is done on initialize
   * 
   * @param The
   *          parent Form DOM element
   */
  this.setForm = function(form) {
    this.form = form;
  };

  /**
   * Sets the fields' modified status to true
   */
  this.applyFieldModification = function(field) {
    return function() {
      field.setModified(true);
    };
  };

  /**
   * Applies field context information for form inputs. Only show the first time
   * 
   * @param {Object}
   *          field The FormField object
   * @param return
   *          A function to display context information to the user
   */
  this.applyContextInformation = function(field) {
    return function() {
      var msgSpan = field.getMessageSpan(); // Span field to display info about state of field

      // If the field hasn't been used yet and there is a context message
      if (msgSpan && field.getModified() === false && field.getDOMElement.value === '' && field.getContextMessage()) {
        field.setState(ONEGEEK.forms.FIELD_STATUS_INFO);
      }
    };
  };

  /**
   * Applies inline field validation for form inputs
   * 
   * @param {Object}
   *          field The FormField object
   * @param return
   *          A function to validate the item
   */
  this.applyFieldValidation = function(field) {
    return function() {
      field.validate();
    };
  };

  /**
   * Set the field's modified status
   */
  this.setModified = function(modified) {
    this.modified = modified;
  };

  /**
   * Get the field's modified status
   */
  this.getModified = function() {
    return this.modified;
  };

  /**
   * Reset the form value and state.
   */
  this.reset = function() {
    this.setModified(false);
    this.setState(ONEGEEK.forms.FIELD_STATUS_INFO);
  };
  
  /**
   * Set the state of the field. This will show the relevant icons and error messages for the field
   * 
   * @param {Object}
   *          state The fields' state. Can be one of: FIELD_STATUS_ERROR, FIELD_STATUS_OK, FIELD_STATUS_INFO
   */
  this.setState = function(state) {

    // Remove previous messages
    util.removeClass(this.messageSpan, 'error');
    util.removeClass(this.messageSpan, 'info');
    util.removeClass(this.messageSpan, 'ok');
    util.removeClass(this.messageSpan, 'hidden');

    // Hide the message always if in COMPACT mode
    if (ONEGEEK.forms.ENABLE_COMPACT_MESSAGES) {
      util.addClass(this.messageSpan, 'hidden');
    }

    var src = '';
    var title = '';
    var alt = '';

    var message = null;
    switch (state) {
      case ONEGEEK.forms.FIELD_STATUS_ERROR :
        src = ONEGEEK.forms.ICON_ALERT;
        alt = 'There are errors with this field. Click for more info.';
        title = 'There are errors with this field. Click for more info.';
        message = this.errorMessage;
        util.addClass(this.messageSpan, 'error');
        break;
      case ONEGEEK.forms.FIELD_STATUS_OK :
        src = ONEGEEK.forms.ICON_OK;
        alt = 'This field has been completed successfully.';
        title = 'This field has been completed successfully.';
        message = this.successMessage;
        util.addClass(this.messageSpan, 'ok');
        break;
      default :
        src = ONEGEEK.forms.ICON_INFO;
        alt = 'Click for more information about this field.';
        title = 'Click for more information about this field.';
        message = this.contextMessage;
        util.addClass(this.messageSpan, 'info');
    }

    if (ONEGEEK.forms.ENABLE_COMPACT_MESSAGES) {
      this.statusImg.src = src;
      this.statusImg.alt = alt;
      this.statusImg.title = title;
    }

    // Display / Hide Message
    if (message !== null) {
      this.messageSpan.innerHTML = message;
    } else {
      util.addClass(this.messageSpan, 'hidden');
    }
  };

  /**
   * If the field is required, show the asterisk
   */
  this.createRequiredSpan = function() {
    var span = document.createElement('span');
    span.className = 'required';
    if (this.isRequired) {
      span.innerHTML = '*';
    } else {
      span.innerHTML = '&nbsp;&nbsp;';
    }

    // Insert before field
    this.field.parentNode.insertBefore(span, this.field.parentNode.firstChild);
  };

  /**
   * Get (and create) the fields status span (field status icon)
   */
  this.createFieldStatusIcon = function() {
    if (this.fieldStatus === null) {
      // Get the icon object
      var msgSpans = this.field.parentNode.getElementsByTagName('span');
      for ( var i = 0; i < msgSpans.length; i++) {
        if (util.doesElementBelongToClass(msgSpans[i], 'fieldstatus')) {
          this.fieldStatus = msgSpans[i];
          return this.fieldStatus;
        }
      }

      // None found - create a new one!
      var span = document.createElement('span');
      span.className = 'fieldstatus';

      // Image
      this.statusImg = document.createElement('img');
      this.statusImg.src = ONEGEEK.forms.ICON_INFO;

      // Link
      this.statusLink = document.createElement('a');
      // this.statusLink.href = "";
      this.statusLink.onclick = addPopupToggle(this.statusLink, this.messageSpan);

      // Place the image inside the link, then the link in the span
      this.statusLink.appendChild(this.statusImg);
      span.appendChild(this.statusLink);

      // Append span: Needs to go between field and message span
      // Get the message span and insert node before it
      this.fieldStatus = this.field.parentNode.insertBefore(span, this.getMessageSpan());
      return this.fieldStatus;
    } else {
      return this.fieldStatus;
    }
  };

  /**
   * Get the function that hides/shows the message span
   */
  var addPopupToggle = function(statusLink, messageSpan) {
    return function() {
      util.togglePopup(statusLink, messageSpan); // Show hide context information on click
    };
  };

  /**
   * Get the fields associated message span
   */
  this.getMessageSpan = function() {
    if (this.messageSpan === null) {
      // Get the MsgSpan object - This is where the form field gets a message
      var msgSpans = this.field.parentNode.getElementsByTagName('span');
      for ( var i = 0; i < msgSpans.length; i++) {
        if (util.doesElementBelongToClass(msgSpans[i], 'msg')) {
          this.messageSpan = msgSpans[i];
          return this.messageSpan;
        }
      }
      // None found - create a new one!
      var span = document.createElement('span');

      if (!ONEGEEK.forms.ENABLE_COMPACT_MESSAGES) {
        span.className = 'msg icon info';
      } else {
        span.className = 'msg hidden info';
      }
      span.innerHTML = this.contextMessage;

      // Append span
      this.messageSpan = this.field.parentNode.appendChild(span);
      return this.messageSpan;
    } else {
      return this.messageSpan;
    }
  };

  /**
   * Validate the field. Defaults to returning true if there is a value for the field
   * 
   * @return true if there is a value, false if not
   */
  this.validate = function() {    
    if (this.field.value) {
      this.setState(ONEGEEK.forms.FIELD_STATUS_OK);
      return true;
    }

    if (this.modified === false) {
      this.setState(ONEGEEK.forms.FIELD_STATUS_INFO);
    } else {
      this.setState(ONEGEEK.forms.FIELD_STATUS_ERROR);
    }

    return false;
  };

  /**
   * Clean the field. This provides no default implementation and should be overriden
   */
  this.clean = function() {
  };

  /**
   * Get the DOM element
   */
  this.getDOMElement = function() {
    return this.field;
  };

  /**
   * Set the DOM element that this field refers to
   */
  this.setDOMElement = function(element) {
    this.field = field;
  };

  /**
   * Return context information about a particular field i.e. "A username should be between 5 and 10 characters
   */
  this.getContextMessage = function() {
    return this.contextMessage;
  };

  /**
   * Get the error message associated with this field
   */
  this.getErrorMessage = function() {
    return this.errorMessage;
  };

  /**
   * Get the success message associated with this field
   */
  this.getSuccessMessage = function() {
    return this.successMessage;
  };

  /**
   * Is this a required field?
   */
  this.isRequiredField = function() {
    return this.isRequired;
  };
};
// End FormField Class

// ///////////////////////////////////////////
// Start FormFieldFactory Class Definition //
// ///////////////////////////////////////////

/**
 * The Form Field Factory provides a way to lookup a specific type of FormField subclass without having to know the concreate class name in advance i.e. To get a FormField object associated with the 'phone' class try: factory.lookup('phone', field) ;
 */
ONEGEEK.forms.FormFieldFactory = function() {
  var formFieldRegister = new Array();

  /**
   * Lookup a form field object from the list of registered FormField objects
   * 
   * @param {Object}
   *          name The class name of the field
   * @param {Object}
   *          field The DOM form field element
   */
  this.lookupFormField = function(name, field) {
    if (formFieldRegister[name] != null) {
      var obj = new (window.ONEGEEK.forms[formFieldRegister[name]['class']])(field);
      obj.setOptions(formFieldRegister[name].options); 
      return obj;
    }
    return null;
  };

  /**
   * Register a FormField subclass with the factory
   * 
   * @param {Object}
   *          classname The name of the CSS class associated with the FormField i.e. 'firstname'
   * @param {Object}
   *          objectClass The FormField concrete subclass i.e. NameField
   * @param {Object} OPTIONAL
   *          options The options to pass in to the object 
   */
  this.registerFormField = function(classname, object, options) {
      // Make sure the name doesn't collide
      if (formFieldRegister[classname] != null) {
        alert('FormFieldFactory registerFormField(): Cannot register field (' + classname + '), as this namespace is in use');
        return;
      }
      formFieldRegister[classname] = {
          'class': object,
          'options': options
      };
  };
};

// Create a global (quasi-singleton) instance of the factory
var formFieldFactory = new ONEGEEK.forms.FormFieldFactory();

// ///////////////////////////////////////////
// Start AbstractComboBox Class Definition //
// ///////////////////////////////////////////

/**
 * Abstract Combo Box provides a default implementation for combo box This class should NOT be instantiated. Subclass and override these methods
 * 
 * @param {Object}
 *          field
 */
ONEGEEK.forms.AbstractComboBox = function(field) {
  this.field = field;

  /**
   * Override the validation function Defaults to returning true if there is a value for the field and showing success otherwise it shows the context information icon
   * 
   * @return true if there is a value, false if not
   */
  this.validate = function() {
    if (this.field.value && this.field.value !== '') {
      this.setState(ONEGEEK.forms.FIELD_STATUS_OK);
      return true;
    }
    if (this.modified === false || !this.isRequired) {
      this.setState(ONEGEEK.forms.FIELD_STATUS_INFO);
    } else {
      this.setState(ONEGEEK.forms.FIELD_STATUS_ERROR);
    }

    return false;
  };

  /**
   * Override setup function.
   */
  this.setup = function() {
    // Check for required class
    if (util.doesElementBelongToClass(this.field, 'required')) {
      this.isRequired = true;
    }
    this.getMessageSpan();
    if (ONEGEEK.forms.ENABLE_COMPACT_MESSAGES) {
      this.createFieldStatusIcon();
    }
    this.createRequiredSpan();
    this.validate();

    // Add events
    util.addEvent(this.field, 'click', this.applyFieldValidation(this));
    util.addEvent(this.field, 'blur', this.applyFieldValidation(this));
    util.addEvent(this.field, 'click', this.applyContextInformation(this));
    util.addEvent(this.field, 'change', this.applyFieldModification(this));
  };
};

// Inherits from the AbstractFormField
ONEGEEK.forms.AbstractComboBox.prototype = new ONEGEEK.forms.AbstractFormField();

// Register the select class with the factory
formFieldFactory.registerFormField('select','AbstractComboBox');
formFieldFactory.registerFormField('combo','AbstractComboBox');

// ///////////////////////////////////////////
// Start AbstractCheckbox Class Definition //
// ///////////////////////////////////////////

/**
 * Abstract CheckBox Button provides a default implementation for This class should NOT be instantiated. Subclass and override these methods
 * 
 * @param {Object}
 *          field
 */
ONEGEEK.forms.AbstractCheckbox = function(field) {
  this.field = field;

  /**
   * Override clean operation to do nothing
   */
  this.clean = function() {
  };

  /**
   * Override validation function:
   */
  this.validate = function() {
    // Check if the form has a value set for this checkbox
    // by cycling through all of the checkboxes
    var elements = document.forms[0].elements[this.field.name];
    for (i = 0; i < elements.length; i++) {
      if (elements[i].checked) {
        this.setState(ONEGEEK.forms.FIELD_STATUS_OK);
        return true;
      } else {
        if (this.modified !== true || !this.isRequired) {
          this.setState(ONEGEEK.forms.FIELD_STATUS_INFO);
        } else {
          this.setState(ONEGEEK.forms.FIELD_STATUS_ERROR);
        }
      }
    }
    return false;
  };

  /**
   * Override the setup function: The validation events need to be applied to ALL of the checkboxes
   */
  this.setup = function() {
    // Check for required class
    if (util.doesElementBelongToClass(this.field, 'required')) {
      this.isRequired = true;
    }
    this.getMessageSpan();
    if (ONEGEEK.forms.ENABLE_COMPACT_MESSAGES) {
      this.createFieldStatusIcon();
    }
    this.createRequiredSpan();
    this.validate();

    // Add events to ALL of the items
    var elements = document.forms[0].elements[this.field.name];
    for (i = 0; i < elements.length; i++) {
      util.addEvent(elements[i], 'click', this.applyFieldValidation(this));
      util.addEvent(elements[i], 'click', this.applyContextInformation(this));
      util.addEvent(elements[i], 'change', this.applyFieldModification(this));
    }
  };
};

// Inherits from the AbstractFormField
ONEGEEK.forms.AbstractCheckbox.prototype = new ONEGEEK.forms.AbstractFormField();

// Register the field type with FormFieldFactory
formFieldFactory.registerFormField('checkbox','AbstractCheckbox');

// ///////////////////////////////////////////
// Start AbstractRadioButton Class Definition //
// ///////////////////////////////////////////

/**
 * Abstract Radio Button provides a default implementation for radio This class should NOT be instantiated. Subclass and override these methods
 * 
 * @param {Object}
 *          field
 */
ONEGEEK.forms.AbstractRadioButton = function(field) {
  this.field = field;

  /**
   * Override clean operation to do nothing
   */
  this.clean = function() {
  };

  /**
   * Override the setup function: The validation events need to be applied to ALL of the checkboxes
   */
  this.setup = function() {
    // Check for required class
    if (util.doesElementBelongToClass(this.field, 'required')) {
      this.isRequired = true;
    }
    this.getMessageSpan();
    if (ONEGEEK.forms.ENABLE_COMPACT_MESSAGES) {
      this.createFieldStatusIcon();
    }
    this.createRequiredSpan();
    this.validate();

    // Add events to ALL of the items
    var elements = document.forms[0].elements[this.field.name];
    for (i = 0; i < elements.length; i++) {
      util.addEvent(elements[i], 'click', this.applyFieldValidation(this));
      util.addEvent(elements[i], 'click', this.applyContextInformation(this));
      util.addEvent(elements[i], 'change', this.applyFieldModification(this));
    }
  };
  /**
   * Override validation function:
   */
  this.validate = function() {
    // Check if the form has a value set for this checkbox
    // by cycling through all of the checkboxes
    var elements = document.forms[0].elements[this.field.name];
    for (i = 0; i < elements.length; i++) {
      if (elements[i].checked) {
        this.setState(ONEGEEK.forms.FIELD_STATUS_OK);
        return true;
      } else {
        if (this.modified !== true || !this.isRequired) {
          this.setState(ONEGEEK.forms.FIELD_STATUS_INFO);
        } else {
          this.setState(ONEGEEK.forms.FIELD_STATUS_ERROR);
        }
      }
    }
    return false;
  };
};

// Inherits from the AbstractFormField
ONEGEEK.forms.AbstractRadioButton.prototype = new ONEGEEK.forms.AbstractFormField();

// Register the field type with FormFieldFactory
formFieldFactory.registerFormField('radio','AbstractRadioButton');

// ////////////////////////////////////////////
// Start AbstractTextField Class Definition //
// ////////////////////////////////////////////

/**
 * Abstract TextField object representing a basic form text field. Provides the basic validation implementations for a TextField or a TextArea This class should not be instantated directly. Use a concrete subclass instead
 * 
 * @param {Object}
 *          field The XHTML DOM field element
 */
ONEGEEK.forms.AbstractTextField = function(field) {
  this.field = field;
  this.regex = ''; // regex to match if ok
  this.cleanRegex = ''; // regex to clean naughty chars
  this.pattern = null; // Pattern that uses regex to match

  /**
   * Overrides the validate function. Defaults to evaluating a regular expression
   * 
   * @return true or false
   */
  this.validate = function() {
    if (this.field.value) {
      this.clean();
      this.pattern = new RegExp(this.regex);
      var validated = this.pattern.test(this.field.value);

      // Check if field passes and show message
      if (validated) {
        this.setState(ONEGEEK.forms.FIELD_STATUS_OK);
      } else {
        this.setState(ONEGEEK.forms.FIELD_STATUS_ERROR);
      }
      return validated;
    }
    
    // Show info if empty and not modified or not required
    if (this.modified === false || this.isRequired === false) {
      this.setState(ONEGEEK.forms.FIELD_STATUS_INFO);
    } else {
      this.setState(ONEGEEK.forms.FIELD_STATUS_ERROR);
    }

    return false;
  };

  /**
   * Overrides the clean function. Defaults to removing illegal chars
   */
  this.clean = function() {
    this.field.value = this.field.value.replace(this.cleanRegex, '');
  };
};

// Inherits from the AbstractFormField
ONEGEEK.forms.AbstractTextField.prototype = new ONEGEEK.forms.AbstractFormField();

// ///////////////////////////////////////////
// Start NameField Class Definition //
// ///////////////////////////////////////////

/**
 * Name Field (Extends FormField). Validate a last name, or first name field with the constraints: - Between 4 and 20 chars - Only letters, spaces, hyphens and apostrophe's - Field is required
 */
ONEGEEK.forms.NameField = function(field) {
  this.field = field;
  this.regex = /^([a-zA-Z\-\'\s]{2,30})$/g;
  this.cleanRegex = /[^a-zA-Z\-\'\s]/g;
  this.errorMessage = 'Your name must be between 2 and 30 characters';
  this.contextMessage = 'We would like to call you by your name';
};

// Subclass FormField
ONEGEEK.forms.NameField.prototype = new ONEGEEK.forms.AbstractTextField();

// Register the field types with FormFieldFactory
formFieldFactory.registerFormField('firstname','NameField');
formFieldFactory.registerFormField('lastname','NameField');
formFieldFactory.registerFormField('name','NameField');

// ///////////////////////////////////////////
// Start PhoneField Class Definition //
// ///////////////////////////////////////////

/**
 * Phone Field (Extends FormField). Validate an australian phone number - Between 8 and 10 chars - Only numbers and spaces allowed
 */
ONEGEEK.forms.PhoneField = function(field) {
  this.field = field;
  this.regex = /^([0-9]{8,10})$/g;
  this.cleanRegex = /[^0-9]/g;
  this.errorMessage = 'Your phone number needs to be at least 8 digits long i.e. 03 1234 5678';
  this.contextMessage = this.errorMessage;
};

// Subclass FormField
ONEGEEK.forms.PhoneField.prototype = new ONEGEEK.forms.AbstractTextField();

// Register the field type with FormFieldFactory
formFieldFactory.registerFormField('phone','PhoneField');

// ///////////////////////////////////////////
// Start EmailField Class Definition //
// ///////////////////////////////////////////

/**
 * Email Field (Extends FormField). Validate an email address. RFC characters are allowed but for easy validation for 99% of emails this will work
 * 
 * @see RFC 2822 : http://tools.ietf.org/html/rfc2822 for more details
 */
ONEGEEK.forms.EmailField = function(field) {
  this.field = field;
  this.regex = /^[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,4}$/i;
  this.errorMessage = 'Please enter a valid email address i.e. user@domain.com';
  this.contextMessage = 'Your email address will be kept confidential';

  /**
   * Override clean() method to do nothing
   */
  this.clean = function() {
  };
};

// Subclass FormField
ONEGEEK.forms.EmailField.prototype = new ONEGEEK.forms.AbstractTextField();

// Register the field type with FormFieldFactory
formFieldFactory.registerFormField('email','EmailField');

// ///////////////////////////////////////////
// Start GenericTextField Class Definition //
// ///////////////////////////////////////////

/**
 * GenericTextField Field (Extends FormField). Validate a generic text field. Don't allow naughty chars such as <>()
 */
ONEGEEK.forms.GenericTextField = function(field) {
  this.field = field;
  this.regex = /^.*$/;
  this.cleanRegex = /[<>\/\\\(\);]/g;
};

// Subclass FormField
ONEGEEK.forms.GenericTextField.prototype = new ONEGEEK.forms.AbstractTextField();

// Register the field types with FormFieldFactory
formFieldFactory.registerFormField('text','GenericTextField');
formFieldFactory.registerFormField('generictext','GenericTextField');

// ///////////////////////////////////////////
// Start CaptchaTextField Class Definition //
// ///////////////////////////////////////////

/**
 * CaptchaTextField Field (Extends FormField). Validate a generic text field. Don't allow naughty chars such as <>()
 */
ONEGEEK.forms.CaptchaTextField = function(field) {
  this.field = field;
  this.regex = /^([A-Za-z0-9\-_]+)$/g;
  this.cleanRegex = /[<>\/\\\(\);]/g;
  this.successMessage = "Thankyou...";
  this.errorMessage = "Please complete the security check";
  this.contextMessage = "This prevents us from spam";
};

// Subclass FormField
ONEGEEK.forms.CaptchaTextField.prototype = new ONEGEEK.forms.AbstractTextField();

// Register the field types with FormFieldFactory
formFieldFactory.registerFormField('captcha','CaptchaTextField');

// ///////////////////////////////////////////
// Start RecaptchaTextField Class Definition //
// ///////////////////////////////////////////

/**
 * RecaptchaTextField Field (Extends FormField). Provides information relevent to the RECAPTCHA captcha system Acts like a generic text field. Don't allow naughty chars such as <>()
 */
ONEGEEK.forms.RecaptchaTextField = function(field) {
  this.field = field;
  this.contextMessage = "Need some <a href='javascript:Recaptcha.showhelp()'>help</a>? Get another <a href='javascript:Recaptcha.reload()'>CAPTCHA</a>";
};

// Subclass CaptchaTextField
ONEGEEK.forms.RecaptchaTextField.prototype = new ONEGEEK.forms.CaptchaTextField();

// Register the field types with FormFieldFactory
formFieldFactory.registerFormField('recaptcha_response_field', new ONEGEEK.forms.RecaptchaTextField());
formFieldFactory.registerFormField('recaptcha','RecaptchaTextField');

// ///////////////////////////////////////////
// Start Form Class Definition //
// ///////////////////////////////////////////

/**
 * The form validator object finds any forms on the page and attaches validation events to the inputs based on class names of the <input>'s. If the element is a required item a * is automatically placed beside the form item and the validation script will ensure it is filled out
 * 
 * @param {Object}
 *          form The form XHTML DOM element OR the form's id
 */
ONEGEEK.forms.Form = function(form) {
  var fields = new Array(); // Array of fields
  form = form || document.getElementById(form) || null; // DOM form object
  var completed = false;
  this.lang = null;

  this.getForm = function() {
    return form;
  };

  this.reset = function() {
    for ( var i = 0; i < fields.length; i++) {
      fields[i].reset();
    }
  };
  
  /**
   * This function is used to validate the form
   */
  this.validate = function(e) {
    var firstErrorElement = null;
    
    // Call the validate events on each of the inputs
    // To update the status of each field
    for ( var i = 0; i < fields.length; i++) {
      // Set the fields status to modified, so the alert icon
      // shows instead of the info if there is an error
      fields[i].setModified(true);

      // Highlight any errors along the way
      var valid = fields[i].validate();

      // Check if field has validated AND
      // if it is a required field
      if (!valid && fields[i].isRequiredField()) {        
        if (!firstErrorElement) {
          firstErrorElement = fields[i].getDOMElement();
        }
      }
    }

    // If an element was found, move the focus to it
    // and display the error
    if (firstErrorElement) {
      firstErrorElement.focus();
      alert('Please correct the highlighted errors.');
      return false;
    }

    // Disable the buttons
    var buttons = form.getElementsByTagName("input");
    for (i = 0; i < buttons.length; i++) {
      if (buttons[i].type == 'submit') {
        buttons[i].setProperty('lastvalue', buttons[i].value);
        buttons[i].disabled = true;
        buttons[i].value = 'Please wait...';
      }
    }
    return true;
  };

  /**
   * Get the form id associated with this FormValidator
   */
  this.getFormId = function() {
    return id;
  };

  /**
   * Get a field by it's name
   * 
   * @param {Object}
   *          name The name attribute of the element
   */
  var getFieldByName = function(name) {
    var field = null;
    for ( var i = 0; i < fields.length; i++) {
      if (fields[i].getDOMElement().name == name) {
        return fields[i].getDOMElement();
      }
    }

    return field;
  };

  /**
   * Read the form XHTML object into an Chaos.forms.validation.Form Object and add the validation and context functions to the inputs
   */
  this.doForm = function() {
        
    if (form) {
      // Set language if not EN
      this.lang = (form.lang !== null && form.lang != 'EN') ? form.lang : null;
      
      // Add validation events to INPUT fields
      var inputs = form.getElementsByTagName("input");
      for ( var i = 0; i < inputs.length; i++) {
        this.doFormField(inputs[i]);
      }

      // Add validation events to TEXTAREA fields
      var textareas = form.getElementsByTagName("textarea");
      for (i = 0; i < textareas.length; i++) {
        this.doFormField(textareas[i]);
      }

      // Add validation events to SELECT fields
      var selects = form.getElementsByTagName("select");
      for (i = 0; i < selects.length; i++) {
        this.doFormField(selects[i]);
      }

      // Add validate() call to form
      util.addEvent(form, 'submit', this.validate);
      util.addEvent(form, 'reset', this.reset);
    }
  };

  /**
   * Apply the validation events to a field
   * 
   * @param {Object}
   *          input The form input/field
   */
  this.doFormField = function(field) {
    // Check type
    if (field && field.type == 'text' || field.type == 'password' || field.type == 'textarea' || field.type == 'select-one' || field.type == 'select-multiple' || field.type == 'checkbox' || field.type == 'file' || field.type == 'radio') {

      // Only apply validation if field is not already being monitored
      if (!getFieldByName(field.name)) {
        // Check class names
        var classname = field.className;
        var fieldObject = null;
        var j = 0;
        
        // Check if multiple class names
        if (classname.indexOf(' ') > -1) {

          var matches = classname.split(' ');
          do {
            classname = matches[j];
            
            // Lookup field from factory for class name
            fieldObject = formFieldFactory.lookupFormField(classname, field);
            j++;
          } while (fieldObject === null && j < matches.length);
        } else {
          fieldObject = formFieldFactory.lookupFormField(classname, field);
        }

        
        // Did we find a field object?
        if (fieldObject) {
          // Set class name assigned to it
          fieldObject.setClassName(classname);
          
          // Set language
          if(this.lang !== null) {
            fieldObject.setLang(this.lang); 
          }
          
          // Add validation and context functions to field
          var element = fieldObject.getDOMElement();
          fieldObject.setup();
          fieldObject.setForm(this);

          // Add the element to the array
          fields[fields.length] = fieldObject;
        }

      }

    }
  };
};
// ////////////////////////////////////////////
// Start GValidator Class Definition //
// ////////////////////////////////////////////

/**
 * The GValidator object finds any forms on the page with classname 'autoform' or 'gform' and attaches validation events to the inputs based on class names of the elements. If the element is a required item a * is automatically placed beside the form item and the validation script will ensure it is completed
 * 
 * @param {Object}
 *          form The form XHTML DOM element
 */
ONEGEEK.forms.GValidator = function() {
  
  /**
   * Read in any config options.
   */
  this.readOptions = function() {
    
  };
  
  /**
   * Read in any user-defined plug-ins.
   * Must come from a user created ONEGEEK.forms.GValidator.plugin variable.
   */  
  this.readPlugins = function() {
    for(item in ONEGEEK.forms.GValidator.plugins) {
      formFieldFactory.registerFormField(item,ONEGEEK.forms.GValidator.plugins[item]._extends, ONEGEEK.forms.GValidator.plugins[item]);
    }
  };
  
  /**
   * Automatically apply form validation functions to any 'autoform'
   */
  this.autoApplyFormValidation = function() {
    var forms = document.getElementsByTagName('form');
    for (i = 0; i < forms.length; i++) {
      if (forms[i].className == 'autoform' || forms[i].className == 'gform') {
        // Create the form object
        var form = new ONEGEEK.forms.Form(forms[i]);

        // Apply validation
        form.doForm();
      }
    }
  };
  
  // Read in config options?
  this.readOptions();
  
  // Initialize Plugins
  this.readPlugins();
};

// Check translation NS
if(typeof(ONEGEEK.forms.GValidator.translation) == 'undefined') {
  ONEGEEK.forms.GValidator.translation = {};
}

// Add load event function
function addLoadEventGVal(func) {
  var oldonload = window.onload;
  if (typeof window.onload != 'function') {
    window.onload = func;
  } else {
    window.onload = function() {
      if (oldonload) {
        oldonload();
      }
      func();
    };
  }
}

// If auto form validation is enabled,
// automatically validate forms on load.
addLoadEventGVal( function() {
  if(ONEGEEK.forms.ENABLE_AUTO_FORM_VALIDATION) {
    gvalidator = new ONEGEEK.forms.GValidator();
    gvalidator.autoApplyFormValidation();
  }
});