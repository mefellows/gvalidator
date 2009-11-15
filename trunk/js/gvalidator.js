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
      // Field Status Constants
      FIELD_STATUS_RESET: 0,
      FIELD_STATUS_ERROR:1,
      FIELD_STATUS_OK: 2,
      FIELD_STATUS_INFO: 3,
      FIELD_STATUS_NONE: 4,
      FIELD_STATUS_EMPTY: 5      
  };
}

// Update native Function and Array prototypes
Function.prototype.gbind = function(object, args) {
  var func = this;
  return function() {
    return func.apply(object, args);
  };
}
;
if(typeof(Array.prototype.inArray) == 'undefined') {
  Array.prototype.inArray = function(needle) {  
    for (key in this) {
      if (this[key] === needle) {
        return true;
      }
    }
    return false;
  };
}

// ///////////////////////////////////////////
// Start DOM Utilities Class Definition //
// ///////////////////////////////////////////

/**
 * General DOM manipulation utilities needed for this library
 */
ONEGEEK.forms.DOMUtilities = function() {
    
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
    if (!this.hasClass(div, 'hidden')) {
      this.addClass(div, 'hidden');
    } else {
      div.style.position = 'absolute';
      div.style.left = coords[0] + 10 + 'px';
      div.style.top = coords[1] - 6 + 'px';
      this.removeClass(div, 'hidden');
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
  this.hasClass = function(element, className) {
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

    if (!this.hasClass(element, className)) {
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
var _du = new ONEGEEK.forms.DOMUtilities();

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
  this.successMsg = 'Completed'; // Messages displayed to user on successful completion
  this.errorMsg = 'Please complete'; // Messages displayed to user on completion error
  this.contextMsg = 'Please complete'; // Messages displayed to user when they are filling out field
  this.emptyMsg = '%field% is required, please complete';
  this.msgSpan = null; // The span to display field errors, messages, validation etc.
  this.isRequired = false; // Is this field required?
  this.statusImg = null; // The image for the status icon span
  this.statusLink = null; // The link for the status icon
  this.fieldStatus = null; // The status field span (<span><a><img/></a></span>)
  this.modified = false; // has the field been modified?
  this.className = null; // The class name used for this element, could be many per type
  var propOptions = ['errorMsg','emptyMsg', 'successMsg', 'contextMsg', 'regex', 'cleanRegex']; // Options that can be overridden by plugins/translations
  this.form = null; // The parent ONEGEEK.forms.form class
  this.state = null;
  
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
  };
  
  /**
   * Set the language translations for this.
   */
  this.setLang = function(lang) {
        
    // Find translation file, even for EN if provided
    var options = null;
    try {
      // Join the defaults with the specific class translations
      this.setOptions(ONEGEEK.forms.GValidator.translation[lang].defaults);
      this.setOptions(ONEGEEK.forms.GValidator.translation[lang][this.className]);      
    } catch (e) {
      // do nothing, default translation (EN, or 'defaults' should it exist) will kick in
    }    
  };
  
  // Add the Icons, spans and validation events
  this.setup = function() {
    // Check for required class
    if (_du.hasClass(this.field, 'required')) {
      this.isRequired = true;
    }
    this.getMsgSpan();
    if (this.form.options.eMsgFormat == 'compact') {
      this.createFieldStatusIcon();
    }
    this.createRequiredSpan();
    this.validate();

    // Add events
    _du.addEvent(this.field, 'blur', this.applyFieldValidation(this));
    _du.addEvent(this.field, 'click', this.applyContextInformation(this));
    _du.addEvent(this.field, 'change', this.applyFieldModification(this));
    
    this.setLabel();
    
  };
  
  this.setLabel = function() {
    // Extract the label from the form, or use 'Field' otherwise
    try {

      if (this.field.type != 'checkbox' && this.field.type != 'radio') {
        var labels = this.form.getForm().getElementsByTagName('label');
        for(var i = 0; i < labels.length; i++) {
          if(labels[i].getAttribute('for') == this.field.id) {
            this.label = labels[i].innerHTML;
            return true;
          }
        }
      }
     
      // Get label from fieldset?
      var parent = this.field.parentNode;
      var tagName = '';
      do {  
        tagName = parent.tagName.toLowerCase();
        if(tagName == 'fieldset') {
          var legend = parent.getElementsByTagName('legend');
          if (legend.length > 0) {
            this.label = legend[0].innerHTML;
            return true;
          }
        }
        parent = parent.parentNode;
      } while(parent && tagName != 'form');
      
    } catch(e) {
      this.label = 'Field';
      return false;
    }
    this.label = 'Field';
    return false;
  };
  
  /**
   * Set the parent form. This is done on initialize
   * 
   * @param The
   *          parent Form ONEGEEK.forms.form element
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
      var msgSpan = field.getMsgSpan(); // Span field to display info about state of field

      // If the field hasn't been used yet and there is a context message
      if (msgSpan && field.getModified() === false && field.getDOMElement.value === '' && field.getContextMsg()) {
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
    this.setState(ONEGEEK.forms.FIELD_STATUS_RESET);
  };
  
  /**
   * Set the state of the field. This will show the relevant icons and error messages for the field
   * 
   * @param {Object}
   *          state The fields' state. Can be one of: FIELD_STATUS_ERROR, FIELD_STATUS_OK, FIELD_STATUS_INFO
   */
  this.setState = function(state) {
    this.state = state;
    
    // Remove previous messages
    _du.removeClass(this.msgSpan, 'error');
    _du.removeClass(this.msgSpan, 'info');
    _du.removeClass(this.msgSpan, 'ok');

    var src = '';
    var title = '';
    var alt = '';

    var message = null;
    switch (state) {
      case ONEGEEK.forms.FIELD_STATUS_EMPTY:
        src = this.form.options.icons.error;
        alt = 'There are errors with this field. Click for more info.';
        title = 'There are errors with this field. Click for more info.';
        // Replace vars in message
        this.emptyMsg = this.emptyMsg.replace('%field%', "'" + this.label + "'");
        message = this.emptyMsg;
        _du.addClass(this.msgSpan, 'error');
        break;
      case ONEGEEK.forms.FIELD_STATUS_ERROR:
        src = this.form.options.icons.error;
        alt = 'There are errors with this field. Click for more info.';
        title = 'There are errors with this field. Click for more info.';
        message = this.errorMsg;
        _du.addClass(this.msgSpan, 'error');
        break;
      case ONEGEEK.forms.FIELD_STATUS_OK:
        src = this.form.options.icons.ok;
        alt = 'This field has been completed successfully.';
        title = 'This field has been completed successfully.';
        message = this.successMsg;
        _du.addClass(this.msgSpan, 'ok');
        break;
      case ONEGEEK.forms.FIELD_STATUS_RESET:
        // Hide the message if in COMPACT mode
        if (this.form.options.eMsgFormat == 'compact') {
          _du.addClass(this.msgSpan, 'hidden');
        }
      default :
        src = this.form.options.icons.info;
        alt = 'Click for more information about this field.';
        title = 'Click for more information about this field.';
        message = this.contextMsg;
        _du.addClass(this.msgSpan, 'info');
    }
    if (this.form.options.eMsgFormat == 'compact') {
      this.statusImg.src = src;
      this.statusImg.alt = alt;
      this.statusImg.title = title;
    }

    // Display / Hide Message
    if (message !== null) {
      this.msgSpan.innerHTML = message;
    } else {
      _du.addClass(this.msgSpan, 'hidden');
    }
  };

  /**
   * If the field is required, show the asterisk
   */
  this.createRequiredSpan = function() {
    // Show the span?
    if(this.form.options.reqShow) {

      var span = document.createElement('span');
      span.className = 'required';
      if (this.isRequired) {
        span.innerHTML = this.form.options.reqChar;
      } else {
        span.innerHTML = ' &nbsp;';
      }
  
      // Insert before field
      if(this.form.options.reqPlacement == 'before') {
        this.field.parentNode.insertBefore(span, this.field.parentNode.firstChild);
      } else {
        this.field.parentNode.insertBefore(span, this.field);
      }
    }
  };

  /**
   * Get (and create) the fields status span (field status icon)
   */
  this.createFieldStatusIcon = function() {
    if (this.fieldStatus === null) {
      // Get the icon object
      var msgSpans = this.field.parentNode.getElementsByTagName('span');
      for ( var i = 0; i < msgSpans.length; i++) {
        if (_du.hasClass(msgSpans[i], 'fieldstatus')) {
          this.fieldStatus = msgSpans[i];
          return this.fieldStatus;
        }
      }

      // None found - create a new one!
      var span = document.createElement('span');
      span.className = 'fieldstatus';

      // Image
      this.statusImg = document.createElement('img');
      this.statusImg.src = this.form.options.icons.info;

      // Link
      this.statusLink = document.createElement('a');
      // this.statusLink.href = "";
      _du.addEvent(this.statusLink, this.form.options.eMsgEventOn, addPopupToggle(this.statusLink, this.msgSpan));
      if(this.form.options.eMsgEventOff !== null) {
        _du.addEvent(this.statusLink, this.form.options.eMsgEventOff, addPopupToggle(this.statusLink, this.msgSpan));
      }

      // Place the image inside the link, then the link in the span
      this.statusLink.appendChild(this.statusImg);
      span.appendChild(this.statusLink);

      // Append span: Needs to go between field and message span
      // Get the message span and insert node before it
      this.fieldStatus = this.field.parentNode.insertBefore(span, this.getMsgSpan());
      return this.fieldStatus;
    } else {
      return this.fieldStatus;
    }
  };

  /**
   * Get the function that hides/shows the message span
   */
  var addPopupToggle = function(statusLink, msgSpan) {
    return function() {
      _du.togglePopup(statusLink, msgSpan); // Show hide context information on click
    };
  };

  /**
   * Get the fields associated message span
   */
  this.getMsgSpan = function() {
    if (this.msgSpan === null) {
      // Get the MsgSpan object - This is where the form field gets a message
      var msgSpans = this.field.parentNode.getElementsByTagName('span');
      for ( var i = 0; i < msgSpans.length; i++) {
        if (_du.hasClass(msgSpans[i], 'msg')) {
          this.msgSpan = msgSpans[i];
          return this.msgSpan;
        }
      }
      // None found - create a new one!
      var span = document.createElement('span');
      if (this.form.options.eMsgFormat == 'compact') {
        span.className = 'msg hidden info';
      } else {
        span.className = 'msg icon info';
      }
      span.innerHTML = this.contextMsg;

      // Append span
      this.msgSpan = this.field.parentNode.appendChild(span);
    }
    return this.msgSpan;    
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
      this.setState(ONEGEEK.forms.FIELD_STATUS_EMPTY);
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
  this.getContextMsg = function() {
    return this.contextMsg;
  };

  /**
   * Get the error message associated with this field
   */
  this.getErrorMsg = function() {
    return this.errorMsg;
  };

  /**
   * Get the success message associated with this field
   */
  this.getSuccessMsg = function() {
    return this.successMsg;
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
      this.setState(ONEGEEK.forms.FIELD_STATUS_EMPTY);
    }

    return false;
  };

  /**
   * Override setup function.
   */
  this.setup = function() {
    // Check for required class
    if (_du.hasClass(this.field, 'required')) {
      this.isRequired = true;
    }
    this.getMsgSpan();
    if (this.form.options.eMsgFormat == 'compact') {
      this.createFieldStatusIcon();
    }
    this.createRequiredSpan();
    this.validate();

    // Add events
    _du.addEvent(this.field, 'click', this.applyFieldValidation(this));
    _du.addEvent(this.field, 'blur', this.applyFieldValidation(this));
    _du.addEvent(this.field, 'click', this.applyContextInformation(this));
    _du.addEvent(this.field, 'change', this.applyFieldModification(this));
    
    this.setLabel();
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
          this.setState(ONEGEEK.forms.FIELD_STATUS_EMPTY);
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
    if (_du.hasClass(this.field, 'required')) {
      this.isRequired = true;
    }
    this.getMsgSpan();
    if (this.form.options.eMsgFormat == 'compact') {
      this.createFieldStatusIcon();
    }
    this.createRequiredSpan();
    this.validate();

    // Add events to ALL of the items
    var elements = document.forms[0].elements[this.field.name];
    for (i = 0; i < elements.length; i++) {
      _du.addEvent(elements[i], 'click', this.applyFieldValidation(this));
      _du.addEvent(elements[i], 'click', this.applyContextInformation(this));
      _du.addEvent(elements[i], 'change', this.applyFieldModification(this));
    }
    
    this.setLabel();
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
    if (_du.hasClass(this.field, 'required')) {
      this.isRequired = true;
    }
    this.getMsgSpan();
    if (this.form.options.eMsgFormat == 'compact') {
      this.createFieldStatusIcon();
    }
    this.createRequiredSpan();
    this.validate();

    // Add events to ALL of the items
    var elements = document.forms[0].elements[this.field.name];
    for (i = 0; i < elements.length; i++) {
      _du.addEvent(elements[i], 'click', this.applyFieldValidation(this));
      _du.addEvent(elements[i], 'click', this.applyContextInformation(this));
      _du.addEvent(elements[i], 'change', this.applyFieldModification(this));
    }
    
    this.setLabel();
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
          this.setState(ONEGEEK.forms.FIELD_STATUS_EMPTY);
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
      this.setState(ONEGEEK.forms.FIELD_STATUS_EMPTY);
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
  this.errorMsg = 'Your name must be between 2 and 30 characters';
  this.contextMsg = 'We would like to call you by your name';
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
  this.errorMsg = 'Your phone number needs to be at least 8 digits long i.e. 03 1234 5678';
  this.contextMsg = this.errorMsg;
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
  this.errorMsg = 'Please enter a valid email address i.e. user@domain.com';
  this.contextMsg = 'Your email address will be kept confidential';

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
  this.successMsg = "Thankyou...";
  this.errorMsg = "Please complete the security check";
  this.contextMsg = "This prevents us from spam";
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
  this.contextMsg = "Need some <a href='javascript:Recaptcha.showhelp()'>help</a>? Get another <a href='javascript:Recaptcha.reload()'>CAPTCHA</a>";
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
ONEGEEK.forms.Form = function(f) {
  var fields = new Array();
  var form = f || document.getElementById(f) || null; // DOM form object
  var completed = false;
  this.lang = null;
  this.custom = false;
 
  // Options that can be overridden by plugins/translations
  var propOptions = ['autoFocus',
                     'eMsgEventOn',
                     'eMsgEventOff',
                     'eMsgFormat',                     
                       // If compact, these options are available
                       'icons', 
                         'error', 
                         'info', 
                         'ok',
                     'eMsgFunction', 
                     'fMsg',
                     'fMsgFormat', 
                     'fMsgContainer', 
                     'fMsgFunction', 
                     'reqShow',
                     'reqChar',
                     'reqPlacement',
                     'supressAlert'
                    ]; 
  
  // Constants: Override in a ONEGEEK.forms.GValidator.options key/value map to suit environment
  this.options = {
      icons: {
        ok: '../images/icons/tick.png',
        info: '../images/icons/help.png',
        error: '../images/icons/icon_alert.gif'
      },
      reqShow: true,
      reqChar: '*',
      reqPlacement: 'after',
      fMsgFormat: 'alert',
      fMsg: 'Please correct the highlighted errors.',
      eMsgFormat: 'open',
      eMsgEventOn: 'click',
      eMsgEventOff: null,
      autoFocus: true
  };
 
  /**
   * Read in the options given recursively, only
   * letting in allowable properties, and merging with existing
   * properties.
   */
  this.readOptions = function(options) {
    this.options = this._readOptionsRecursive(this.options, options);
  };
  
  /**
   * Merges two options object property maps, into one object property map.
   */
  this._readOptionsRecursive = function(opts1, opts2) {
    for (var p in opts2) {
      if (propOptions.inArray(p)) {
        try {
          // Property in destination Object set; update its value.
          if ( typeof(opts2[p]) == 'object' ) {
            opts1[p] = this._readOptionsRecursive(opts1[p], opts2[p]);
          } else {
            opts1[p] = opts2[p];
          }
        } catch(e) {
          // Property in destination Object not set; create it and set its value.
          opts1[p] = opts2[p];
        }
      }
    }
    return opts1;
  };

  
  /**
   * Read in any general/specific config options.
   */
  this.setOptions = function() {
    try {
      // Get any generic custom options   
      this.readOptions(ONEGEEK.forms.GValidator.options);
      
      // Get any form specific options
      if (this.custom === true) {        
        this.readOptions(ONEGEEK.forms.GValidator.options[form.id]);
      }
    } catch (e) {
      // do nothing, default options will exist
    }    
  };

  /**
   * Reset each form field validator.
   */
  this.reset = function() {
    for ( var i = 0; i < fields.length; i++) {
      fields[i].reset();
    }
  };
  
  /**
   * Get the DOM form.
   */
  this.getForm = function() {
    return form;
  };
  
  /**
   * Handle's the form level errors.
   */
  this.handleErrors = function(errors) {
    
    if(this.options.supressAlert !== true) {
      alert(this.options.fMsg);
    }
    
    /**
     * Show FORM level errors.
     */    
    switch(this.options.fMsgFormat) {
      case 'container':
        
        // Remove old erros
        var el = document.getElementById('gvErrorsList');                
        var c = document.getElementById(this.options.fMsgContainer); 
        var l = document.createElement('ul');
        l.id = 'gvErrorsList';
        
        for(var i=0; i < errors.length; i++) {
          var li = document.createElement('li');
          
          if (errors[i].state === ONEGEEK.forms.FIELD_STATUS_ERROR) {
            li.innerHTML = errors[i].errorMsg;  
          } else {
            li.innerHTML = errors[i].emptyMsg;
          }
          l.appendChild(li);
        }
        
        if(el) {
          c.replaceChild(l, el);
        } else {
          c.appendChild(l);  
        }
        _du.removeClass(c, 'hidden');
        
        // Scroll to the error container
        window.location = '#' + this.options.fMsgContainer;
        
        break;
      case 'function':
        return this.options.fMsgFunction(errors);
      default:        
        break;
    }
    
    // Otherwise, return false!
    return false;
  };
  
  /**
   * This function is used to validate the form
   */
  this.validate = function(e) {
    var firstErrorElement = null;
    var errors = [];
    var errorsE = [];
    
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
          errors[errors.length] = fields[i];
          errorsE[errorsE.length] = fields[i].getDOMElement();
      }
    }

    // If an element was found, move the focus to it
    // and display the error
    if (errors[0]) {
      errorsE[0].focus();
      
      this.handleErrors(errors);      
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
  
  this.applyFocus = function() {
    // @todo: fix this
    if(this.options.autoFocus === true) {
      var inputs = document.getElementsByTagName('input');
      if(inputs.length > 0) {
        inputs[0].focus();
      }
    }
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
      this.lang = (form.lang) ? form.lang : null;      
      
      // Custom configuration needed?
      if (_du.hasClass(form, 'custom')) {
        this.custom = true;  
      }
      
      // Read in config options for validation behaviour
      this.setOptions();
      
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
      form.onsubmit = this.validate.gbind(this);
//      form.onreset = this.reset.gbind(this);
//      _du.addEvent(form, 'submit', this.validate.bind(this));
      _du.addEvent(form, 'reset', this.reset.gbind(this));
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
          fieldObject.setForm(this);
          fieldObject.setup();          

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
  var gForms = [];
  
  /**
   * Read in any user-defined plug-ins.
   * Must come from a user created ONEGEEK.forms.GValidator.plugin variable.
   */  
  this.readPlugins = function() {
    // Add each detected plugin to the form field registry 
    for(item in ONEGEEK.forms.GValidator.plugins) {
      formFieldFactory.registerFormField(item,ONEGEEK.forms.GValidator.plugins[item]._extends, ONEGEEK.forms.GValidator.plugins[item]);
    }
  };
  
  /**
   * Apply focus to the first input element
   */
  this.applyFocus = function() {
    if(gForms.length > 0) {
      gForms[0].applyFocus();
    }
  };
  
  /**
   * Automatically apply form validation functions to any 'autoform'
   */
  this.autoApplyFormValidation = function() {
    var forms = document.getElementsByTagName('form');
    
    for (var i = 0; i < forms.length; i++) {
      if (_du.hasClass(forms[i], 'autoform') || _du.hasClass(forms[i], 'gform')) {
        // Create the form object
        gForms[i] = new ONEGEEK.forms.Form(forms[i]);

        // Apply validation
        gForms[i].doForm();
      }
    }
    
    this.applyFocus();
  };
  
  // Initialize Plugins
  this.readPlugins();
};

// Check translation NS
if(typeof(ONEGEEK.forms.GValidator.translation) == 'undefined') {
  ONEGEEK.forms.GValidator.translation = {};
}

// Add load event fu;nction
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

// Automatically validation to forms on load.
addLoadEventGVal( function() {    
  gvalidator = new ONEGEEK.forms.GValidator();  
  gvalidator.autoApplyFormValidation();
});