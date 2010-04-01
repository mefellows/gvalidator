/**
 * GValidator - JavaScript Form Validation Library
 * 
 * @project GValidator
 * @author Matt Fellows, OneGeek Software (http://www.onegeek.com.au)
 * @version $Rev: 79 $
 * @description JavaScript Form Validation Library
 * 
 */

/**
 * Create the ONEGEEK global namespace object
 * 
 * @package ONEGEEK
 */
if (typeof (ONEGEEK) == "undefined") {
  /**
   * The ONEGEEK global namespace object. If ONEGEEK is already defined, the existing ONEGEEK object will not be overwritten so that defined namespaces are preserved.
   * 
   * @class ONEGEEK
   */
  ONEGEEK = {};
}

/**
 * Register the forms package namespace if it doesn't exist
 * 
 * @package ONEGEEK.forms
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
/**
 * General DOM manipulation utilities needed for this library
 * 
 * @class ONEGEEK.forms.DOMUtilities
 */
ONEGEEK.forms.DOMUtilities = function() {
    
  /**
   * Get the x and y coordinates of an element relative to the top left corner of the window
   * 
   * @function {public Array} findPos 
   * @param {Object} obj  The source element
   * @return An array containing the x,y coords of obj
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
   * @function {public void} togglePopup
   * @param {Object} source The source element that is sending the request
   * @param {Object} target The target element to show/hide
   * @return void
   */
  this.togglePopup = function(source, target) {
    var div = target;
    var coords = this.findPos(source);
    if (!_du.hasClass(div, 'hidden')) {
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
   * @function {public Boolean} hasClass
   * @param {Object} element  The element to check
   * @param {Object} class    The class to check against the element
   * @return The result of the operation
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
   * @function {public void} removeClass
   * @param {Object} element    The element to check
   * @param {Object} className  The class to remove from the element
   * @return void
   */
  this.removeClass = function(element, className) {
    var classes = element.className;
    var regex = '\b' + className + '\b';
    element.className = classes.replace(className, '');
  };

  /**
   * Add a class name to an element
   * 
   * @function {public void} addClass
   * @param {Object} element  The element to check
   * @param {Object} class    The class to add to the element
   * @return void
   */
  this.addClass = function(element, className) {
    var classes = element.className;

    if (!this.hasClass(element, className)) {
      element.className += " " + className;
    }
  };

  /**
   * Attach an event to an element. 
   * Handles for most browsers NB. 
   * To make it work in crappy old browsers assign the element an id
   * 
   * @function {public void} addEvent
   * @param {DOMElement}  element The element to add the event to
   * @param {String}      event   The type of event i.e. 'click','mouseover'
   * @param {Function}    handler The function handler for the event
   * @return void
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

/**
 * Additions to the Function prototype.
 * @namespace Function
 */

/**
 * Binds an object and any number of args to a function.
 * 
 * gbind is used instead of the common 'bind' to avoid conflicts.
 * 
 * @function {public Function} gbind
 * @param {Object} object The object to bind to this function
 * @param {Array}  args   The args to pass to the function 
 * @return The function with the new 'this'.
 */
Function.prototype.gbind = function(object, args) {
  var func = this;
  return function() {
    return func.call(object, args);	   
  };
};

/**
 * END additions to the Function prototype
 * @end
 */

/**
 * Additions to the Array prototype.
 * @namespace Array
 */

/**
 * Check if a given needle exists in the current array. 
 * 
 * gcontains is used to avoid conflict.
 * 
 * @function {public Boolean} gcontains
 * @param {String} needle The needle/key to find in the current array
 * @return True if the key is in the array
 */ 
Array.prototype.gcontains = function(needle) {  
  for (var key in this) {
    if (this[key] === needle) {
      return true;
    }
  }
  return false;
};

/**
 * END additions to the Array prototype
 * @end
 */

/**
 * Abstract Form Field object. 
 * 
 * Has the necessary functions to access, validate and clean a form elements' data 
 * This class should NOT be instantiated. 
 * Subclass and override these methods
 * 
 * @class {abstract} ONEGEEK.forms.AbstractFormField
 */
ONEGEEK.forms.AbstractFormField = function(field) {
  
  /**
   * DOM Element.
   * 
   * @var {protected DOMElement} field
   */
  this.field = field || null;
  
  /**
   * Messages displayed to user on successful completion
   * 
   * @var {protected String} successMsg
   */
  this.successMsg = 'Completed';
  
  /**
   * Messages displayed to user on completion error
   * 
   * @var {protected String} errorMsg
   */
  this.errorMsg = 'Please complete';
  
  /**
   * Messages displayed to user when they are filling out field
   * 
   * @var {protected String} contextMsg
   */
  this.contextMsg = 'Please complete';
  
  /**
   * Messages displayed to user when submitting an empty value for a required field
   * 
   * @var {protected String} emptyMsg
   */
  this.emptyMsg = '%field% is required, please complete';
  
  /**
   * The span to display field errors, messages, validation etc.
   * 
   * @var {protected String} msgSpan
   */
  this.msgSpan = null;
  
  /**
   * Is this field required?
   * 
   * @var {protected Boolean} isRequired
   */
  this.isRequired = false;
  
  /**
   * The image for the status icon span
   * 
   * @var {protected DOMElement} statusImg
   */
  this.statusImg = null;
  
  /**
   * The link for the status icon
   * 
   * @var {protected DOMElement} statusLink
   */
  this.statusLink = null;
  
  /**
   * The status field span
   *  
   * @var {protected DOMElement} fieldStatus
   */
  this.fieldStatus = null;
  
  /**
   * Has the field been modified?
   * 
   * @var {protected Boolean} modified
   */
  this.modified = false;
  
  /**
   * The class name used for this element, could be many per type
   * 
   * @var {protected String} className
   */
  this.className = null;

  /**
   * The parent ONEGEEK.forms.form class
   * 
   * @var {protected ONEGEEK.forms.form} form
   */
  this.form = null;
  
  /**
   * Current state of the field.
   * 
   * @var {protected String} state
   */
  this.state = null;
  
  /**
   * Override the default options for a class.
   * Used by translation service and plugins.
   * 
   * @function {public void} setOptions
   * @param {Object} options The key/value pairs of options to override
   * @return void
   */
  this.setOptions = function(options) {
    // Override property values if allowed
    for(var item in options) {      
      // If option already exists, then back it up with an '_' prefix so that it can still be 'inherited'
      if(this[item] != null) {
        this['_' + item] = this[item];
      }
      
      // Set new option
      this[item] = options[item];      
    }
  };
  
  /**
   * Set the class name that this element uses 
   * for validation purposes.
   * 
   * @function {public void} setClassName
   * @param {String} classname The class name that this element is using
   * @return void
   */
  this.setClassName = function(classname) {
    this.className = classname;
  };
  
  /**
   * Set the language translations for this.
   * 
   * @function {public void} setLang
   * @param {string} lang The new language to use for the element i.e. "EN", "DE" etc.
   * @return void
   */
  this.setLang = function(lang) {
    lang = lang.toUpperCase();
    
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
  
  /**
   * Add the Icons, spans and validation events
   *  
   * @function {public void} setup
   * @return void
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
    _du.addEvent(this.field, 'blur', this.applyFieldValidation(this));
    _du.addEvent(this.field, 'click', this.applyContextInformation(this));
    _du.addEvent(this.field, 'change', this.applyFieldModification(this));
    
    this.setLabel();
    
  };
  
  /**
   * Automatically sets the label for this element.
   * 
   * @function {public Boolean} setLabel
   * @return The result of the label find
   */
  this.setLabel = function() {
    // Already have a label?
    if (this.label) {
      return true;
    }
    
    // Extract the label from the form, Legend or use 'Field' otherwise
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
   * @function {public void} setForm
   * @param {DOMElement} form The parent Form ONEGEEK.forms.form element
   * @return void
   */
  this.setForm = function(form) {
    this.form = form;
  };

  /**
   * Sets the fields' modified status to true.
   * 
   * @function {private Function} applyFieldModification
   * @param {ONEGEEK.forms.AbstractFormField} field The field to set the updated flag 
   * @return The function used to update the fields modified status
   */
  this.applyFieldModification = function(field) {
    return function() {
      field.setModified(true);
    };
  };

  /**
   * Applies field context information for form inputs. Only show the first time
   * 
   * @function {private Function} applyContextInformation
   * @param {ONEGEEK.forms.AbstractFormField} field The FormField object
   * @return A function to display context information to the user
   */
  this.applyContextInformation = function(field) {
    return function() {
      var msgSpan = field.getMsgSpan(); // Span field to display info about state of field

      // If the field hasn't been used yet and there is a context message
      if (msgSpan && field.getModified() === false && field.getDOMElement.value === '' && field.contextMsg) {
        field.setState(ONEGEEK.forms.FIELD_STATUS_INFO);
      }
    };
  };

  /**
   * Applies inline field validation for form inputs
   * 
   * @function {private Function} applyFieldValidation
   * @param {ONEGEEK.forms.AbstractFormField} field The FormField object
   * @return A function to validate the field
   */
  this.applyFieldValidation = function(field) {
    return function() {
      field.validate();
    };
  };

  /**
   * Set the field's modified status
   * 
   * @function {public void} setModified
   * @param {Boolean} modified The new modified status of the field
   * @return void
   */
  this.setModified = function(modified) {
    this.modified = modified;
  };

  /**
   * Get the field's modified status
   * 
   * @function {public Boolean} getModified
   * @return The modified status of the field
   */
  this.getModified = function() {
    return this.modified;
  };

  /**
   * Reset the form value and state.
   * 
   * @function {public void} reset
   * @return void
   */
  this.reset = function() {
    this.setModified(false);
    this.setState(ONEGEEK.forms.FIELD_STATUS_RESET);
  };
  
  /**
   * Highlights the field according to GValidator options
   * @function {public void} highlight
   * @return void
   */
  this.highlight = function() {    
    if(!this.form.options.highlightFields) {
      // Do nothing
      return;
    }
    
    // Remove the class
    _du.removeClass(this.field, this.form.options.highlightFields);
    
    // Add class if error
    switch (this.state) {
      case ONEGEEK.forms.FIELD_STATUS_EMPTY:
      case ONEGEEK.forms.FIELD_STATUS_ERROR:
        _du.addClass(this.field, this.form.options.highlightFields.toString());
        break;        
    }
  };
  
  /**
   * Set the state of the field. This will show the relevant icons and error messages for the field
   * 
   * @function {public void} setState
   * @param {String} state The fields' state. Can be one of: ONEGEEK.forms.FIELD_STATUS_(EMPTY|OK|INFO|ERROR|RESET)
   * @return void
   */
  this.setState = function(state) {
    this.state = state;
    
    // Remove previous messages
    this.highlight();
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
   * Create and insert the required span field if option enabled.
   * 
   * @function {public void} createRequiredSpan
   * @return void
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
   * 
   * @function {public void} createFieldStatusIcon
   * @return void
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
   * 
   * @function {private void} addPopupToggle
   * @param {DOMElement} statusLink The link where the popup is
   * @param {DOMElement} msgSpan    The span to show/hide
   * @return void
   */
  var addPopupToggle = function(statusLink, msgSpan) {
    return function() {
      _du.togglePopup(statusLink, msgSpan); // Show hide context information on click
    };
  };

  /**
   * Get the fields' associated message span
   * 
   * @function {public DOMElement} getMsgSpan
   * @return The DOMElement message span
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
   * @function {public void} validate
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
   * 
   * @function {public void} clean
   */
  this.clean = function() {
  };

  /**
   * Get the actual DOM element for this field
   * 
   * @function {public DOMElement} getDOMElement
   * @return The DOM Element for this field
   */
  this.getDOMElement = function() {
    return this.field;
  };

  /**
   * Is this a required field?
   * 
   * @function {public Boolean} isRequiredField
   * @return The requiredness of this field
   */
  this.isRequiredField = function() {
    return this.isRequired;
  };
};
// End FormField Class

// ///////////////////////////////////////////
// Start FormFieldFactory Class Definition  //
// ///////////////////////////////////////////

/**
 * The Form Field Factory provides a way to lookup a specific type of FormField subclass without having to know the concreate class name in advance i.e. To get a FormField object associated with the 'phone' class try: factory.lookup('phone', field) ;
 * 
 * @class ONEGEEK.forms.FormFieldFactory
 */
ONEGEEK.forms.FormFieldFactory = function() {
  /**
   * The set of form fields registered to listen on form element classNames
   * i.e. Checkbox (ONEGEEK.forms.Checkbox)
   * 
   * @var {String[]} formFieldRegister
   */
  var formFieldRegister = new Array();

  /**
   * Lookup a form field object from the list of registered FormField objects
   * 
   * @function {public ONEGEEK.forms.AbstractFormField} lookupFormField
   * @param {String}      name  The class name of the field
   * @param {DOMElement}  field The DOM form field element to attach the class to
   * @return A new instance of a ONEGEEK.forms.AbstractFormField subclass if found, or null if not found
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
   * @function {public void} registerFormField
   * @param {String}         classname    The name of the CSS class associated with the FormField i.e. 'firstname'
   * @param {String}         objectClass  The FormField concrete subclass i.e. NameField
   * @param {optional Array} options      The options to pass in to the object
   * @return void 
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

/**
 * Create a global instance of the factory.
 * 
 * @var {public ONEGEEK.forms.FormFieldFactory} formFieldFactory
 */ 
var formFieldFactory = new ONEGEEK.forms.FormFieldFactory();

/**
 * Combo Box.
 * 
 * Provides a default implementation for combo box This class should NOT be instantiated. Subclass and override these methods
 * 
 * @class ONEGEEK.forms.ComboBox
 * @extends ONEGEEK.forms.AbstractFormField
 */
ONEGEEK.forms.ComboBox = function(field) {
  this.field = field;

  /**
   * Override the validation function.
   * Defaults to returning true if there is a value for the field and showing success otherwise it shows the context information icon
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
ONEGEEK.forms.ComboBox.prototype = new ONEGEEK.forms.AbstractFormField();

// Register the select class with the factory
formFieldFactory.registerFormField('select', 'ComboBox');
formFieldFactory.registerFormField('combo', 'ComboBox');

/**
 * CheckBox.
 * 
 * Provides a default implementation for This class should NOT be instantiated. Subclass and override these methods
 * 
 * @class ONEGEEK.forms.Checkbox
 * @extends ONEGEEK.forms.AbstractFormField
 */
ONEGEEK.forms.Checkbox = function(field) {
  this.field = field;

  /**
   * Override clean operation to do nothing
   */
  this.clean = function() {
  };

  /**
   * Override validation function
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
   * Override the setup function: 
   * The validation events need to be applied to ALL of the checkboxes
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
ONEGEEK.forms.Checkbox.prototype = new ONEGEEK.forms.AbstractFormField();

// Register the field type with FormFieldFactory
formFieldFactory.registerFormField('checkbox', 'Checkbox');

/**
 * Abstract Radio Button.
 * 
 * Provides a default implementation for radio This class should NOT be instantiated. Subclass and override these methods
 * 
 * @class ONEGEEK.forms.RadioButton
 * @extends ONEGEEK.forms.AbstractFormField
 */
ONEGEEK.forms.RadioButton = function(field) {
  this.field = field;

  /**
   * Override clean operation to do nothing
   */
  this.clean = function() {
  };

  /**
   * Override the setup function: 
   * The validation events need to be applied to ALL of the radio buttons
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
ONEGEEK.forms.RadioButton.prototype = new ONEGEEK.forms.AbstractFormField();

// Register the field type with FormFieldFactory
formFieldFactory.registerFormField('radio', 'RadioButton');

/**
 * Abstract TextField.
 * 
 * Object representing a basic form text field. Provides the basic validation implementations for a TextField or a TextArea This class should not be instantated directly. Use a concrete subclass instead
 * 
 * @class ONEGEEK.forms.AbstractTextField
 * @extends ONEGEEK.forms.AbstractFormField
 */
ONEGEEK.forms.AbstractTextField = function(field) {
  this.field = field;
  this.regex = ''; // regex to match if ok
  this.cleanRegex = ''; // regex to clean naughty chars
  this.pattern = null; // Pattern that uses regex to match

  /**
   * Overrides the validate function. Defaults to evaluating a regular expression
   */
  this.validate = function() {
    if (this.field.value) {
      this.clean();
      this.pattern = new RegExp(this.regex);
      var validated = this.pattern.test(this.field.value);

      // Reset last index for Safari! (Issue 15)
      this.pattern.lastIndex = 0;
      
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

/**
 * Name Field (Extends FormField). 
 * 
 * Validate a last name, or first name field with the constraints: - Between 4 and 20 chars - Only letters, spaces, hyphens and apostrophe's - Field is required
 * 
 * @class ONEGEEK.forms.NameField
 * @extends ONEGEEK.forms.AbstractFormField
 */
ONEGEEK.forms.NameField = function(field) {
  this.field = field;
  this.regex = /^([a-zA-Z\-\'\s]{2,30})$/g;
  this.cleanRegex = /[^a-zA-Z\-\'\s]/g;
  this.errorMsg = 'Your name must be between 2 and 30 characters';
  this.contextMsg = 'Please enter your name';
};

// Subclass FormField
ONEGEEK.forms.NameField.prototype = new ONEGEEK.forms.AbstractTextField();

// Register the field types with FormFieldFactory
formFieldFactory.registerFormField('firstname', 'NameField');
formFieldFactory.registerFormField('lastname', 'NameField');
formFieldFactory.registerFormField('name', 'NameField');

/**
 * Phone Field. Validate an australian phone number - Between 8 and 10 chars - Only numbers and spaces allowed
 * 
 * @class ONEGEEK.forms.PhoneField
 * @extends ONEGEEK.forms.AbstractFormField
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

/**
 * Password Field. Validates a password field, mandating between 6 - 32 chars.
 * 
 * @class ONEGEEK.forms.PasswordField
 * @extends ONEGEEK.forms.AbstractFormField
 */
ONEGEEK.forms.PasswordField = function(field) {
  this.field = field;
  this.regex = /^.*(?=.{8,})(?=.*[a-z])(?=.*[A-Z])(?=.*[\d\W]).*$/;
  this.cleanRegex = '';
  this.errorMsg = 'Please enter a password at least 8 characters in length using digits, lower and uppercase letters';
  this.contextMsg = this.errorMsg;
};

// Subclass FormField
ONEGEEK.forms.PasswordField.prototype = new ONEGEEK.forms.AbstractTextField();

// Register the field type with FormFieldFactory
formFieldFactory.registerFormField('password','PasswordField');

/**
 * Confirm Password Field. Confirms that the password field .
 * 
 * @class ONEGEEK.forms.ConfirmPasswordField
 * @extends ONEGEEK.forms.PassworField
 */
ONEGEEK.forms.ConfirmPasswordField = function(field) {
  this.field = field;
  this.errorMsg = 'Please confirm your password';
  this.contextMsg = this.errorMsg;
  
  /**
   * Overrides the validate function. Validates regex and compares to initial password.
   */  
  this.validate = function() {
    if (this.field.value) {
        this.clean();

        this.pattern = new RegExp(this.regex);
        var validated = this.pattern.test(this.field.value);
        
        // Reset last index for Safari! (Issue 15)
        this.pattern.lastIndex = 0;

        // If valid syntax, check if it matches the initial password
        if (validated) {
        	var confirm = document.getElementById('password');
        	if(this.field.value != confirm.value) {
        		validated = false;
        	}
        }
        
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
};

// Subclass PasswordField
ONEGEEK.forms.ConfirmPasswordField.prototype = new ONEGEEK.forms.PasswordField();

// Register the field type with FormFieldFactory
formFieldFactory.registerFormField('confirmpassword','ConfirmPasswordField');

/**
 * Email Field. 
 * 
 * Validate an email address. 
 * 
 * RFC characters are allowed but for easy validation for 99% of emails, this will work
 * 
 * @class ONEGEEK.forms.EmailField
 * @extends ONEGEEK.forms.AbstractFormField
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

/**
 * GenericTextField Field. 
 * 
 * Validate a generic text field. Don't allow naughty chars such as 
 * &lt;&gt;()
 * 
 * @class ONEGEEK.forms.GenericTextField
 * @extends ONEGEEK.forms.AbstractFormField
 */
ONEGEEK.forms.GenericTextField = function(field) {
  this.field = field;
  this.regex = /[.\s]*/m;
  this.cleanRegex = /[<>\/\\\(\);]/g;
};

// Subclass FormField
ONEGEEK.forms.GenericTextField.prototype = new ONEGEEK.forms.AbstractTextField();

// Register the field types with FormFieldFactory
formFieldFactory.registerFormField('text', 'GenericTextField');
formFieldFactory.registerFormField('generictext', 'GenericTextField');

/**
 * CaptchaTextField Field. 
 * 
 * Validate a generic text field. Don't allow naughty chars such as &gt;&lt()
 * 
 * @class ONEGEEK.forms.CaptchaTextField
 * @extends ONEGEEK.forms.AbstractFormField
 */
ONEGEEK.forms.CaptchaTextField = function(field) {
  this.field = field;
  this.regex = /^([A-Za-z0-9\-_]+)$/g;
  this.cleanRegex = /[<>\/\\\(\);]/g;
  this.successMsg = "Thankyou.";
  this.errorMsg = "Please complete the security check";
  this.contextMsg = "This prevents us from spam";
};

// Subclass FormField
ONEGEEK.forms.CaptchaTextField.prototype = new ONEGEEK.forms.AbstractTextField();

// Register the field types with FormFieldFactory
formFieldFactory.registerFormField('captcha', 'CaptchaTextField');

// ///////////////////////////////////////////
// Start RecaptchaTextField Class Definition //
// ///////////////////////////////////////////

/**
 * RecaptchaTextField Field, for integration with the ReCaptcha system - does NOT use ajax or anything to validate. 
 * 
 * Provides context information relevent to the RECAPTCHA captcha system, but acts like a generic text field. 
 * Don't allow naughty chars such as &lt;&gt;()
 * 
 * @class ONEGEEK.forms.RecaptchaTextField
 * @extends ONEGEEK.forms.AbstractFormField
 */
ONEGEEK.forms.RecaptchaTextField = function(field) {
  this.field = field;
  this.contextMsg = "Need some <a href='javascript:Recaptcha.showhelp()'>help</a>? Get another <a href='javascript:Recaptcha.reload()'>CAPTCHA</a>";
  this.errorMsg = "Please complete. [Get another <a href='javascript:Recaptcha.reload()'>CAPTCHA</a>]";
};

// Subclass CaptchaTextField
ONEGEEK.forms.RecaptchaTextField.prototype = new ONEGEEK.forms.CaptchaTextField();

// Register the field types with FormFieldFactory
formFieldFactory.registerFormField('recaptcha_response_field', 'RecaptchaTextField');
formFieldFactory.registerFormField('recaptcha', 'RecaptchaTextField');

/**
 * The form validator object finds any forms on the page and attaches validation events to the inputs based on class names of the <input>'s. If the element is a required item a * is automatically placed beside the form item and the validation script will ensure it is filled out
 * 
 * @class ONEGEEK.forms.Form
 */
ONEGEEK.forms.Form = function(f) {
  
  /**
   * The set of ONEGEEK.form.AbstractTextField fields.
   * 
   * @var {private ONEGEEK.form.AbstractTextField[]} fields
   */
  var fields = new Array();
  
  /**
   * The DOM Form Element
   * 
   * @var {private DOMElement} form
   */
  var form = f || document.getElementById(f) || null; // DOM form object
  
  /**
   * The current language for the form.
   * 
   * @var {protected String} lang
   */
  this.lang = null;
  
  /**
   * Is this a custom configuration form?
   * 
   * @var {protected Boolean} custom
   */
  this.custom = false;
 
  /**
   * Options that can be overridden by plugins/translations
   * 
   * @var {private Object} propOptions
   */
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
                     'reqShow',
                     'reqChar',
                     'reqPlacement',
                     'supressAlert',
                     'highlightFields'
                    ]; 
  
  /**
   * Constants: Override in a ONEGEEK.forms.GValidator.options key/value map to suit environment
   * 
   * @var {protected Object} options
   */
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
      autoFocus: true,
      highlightFields: 'highlight'
  };
 
  /**
   * Read in custom options.
   * 
   * Read in the options given recursively, only
   * letting in allowable properties, and merging with existing
   * properties.
   * 
   * @function {public void} readOptions
   * @param {Object} options The custom override options
   * @return void
   */
  this.readOptions = function(options) {
    this.options = this._readOptionsRecursive(this.options, options);
  };
  
  /**
   * Merges two option object key/value pairs, into one object property map.
   * 
   * @function {private Object} _readOptionsRecursive
   * @param {Object} opts1 The initial options
   * @param {Object} opts2 The custom override options
   * @return The merged options
   */
  this._readOptionsRecursive = function(opts1, opts2) {
    for (var p in opts2) {
      if (propOptions.gcontains(p)) {
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
   * Read in any general/specific config options from the ONEGEEK.forms.GValidator.options variable.
   * 
   * @function {public void} setOptions
   * @return void
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
   * 
   * @function {public void} reset
   * @return void
   */
  this.reset = function() {
    for ( var i = 0; i < fields.length; i++) {
      fields[i].reset();
    }
  };
  
  /**
   * Get the DOM form.
   * 
   * @function {public DOMElement} getForm
   * @return The DOM Form Element
   */
  this.getForm = function() {
    return form;
  };
  
  /**
   * Handle's the form level errors.
   * 
   * @function {public Boolean} handleErrors
   * @param {ONEGEEK.forms.AbstractFormField[]} The error fields
   * @return false in all cases except if there is a function handler specified (as a custom option), in which case void 
   */
  this.handleErrors = function(fields) {
    
    if(this.options.supressAlert !== true) {
      alert(this.options.fMsg);
    }

    /**
     * Show FORM level errors.
     */    
    switch(typeof(this.options.fMsgFormat)) {
      case 'string':
        
        // Remove old erros
        var el = document.getElementById('gvErrorsList');                
        var c = document.getElementById(this.options.fMsgFormat);
        if(!c) {
          break;
        }
        var l = document.createElement('ul');
        l.id = 'gvErrorsList';
        
        for(var i=0; i < fields.length; i++) {
          var li = document.createElement('li');
          
          if (fields[i].state === ONEGEEK.forms.FIELD_STATUS_ERROR) {
            li.innerHTML = fields[i].errorMsg;  
          } else {
            li.innerHTML = fields[i].emptyMsg;
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
        window.location = '#' + this.options.fMsgFormat;
        
        break;
      case 'function':
        return this.options.fMsgFormat(fields);
      default:        
        break;
    }
    
    // Otherwise, return false!
    return false;
  };
  
  /**
   * This function is used to validate the form
   * 
   * @function {public Boolean} validate
   * @return true if form is valid, false otherwise
   */
  this.validate = function() {
    var firstErrorElement = null;
    var errors = [];
    var errorsE = [];
    
    // Call the validate events on each of the inputs
    // To update the status of each field
    for ( var i = 0; i < fields.length; i++) {
      // Set the fields status to modified, so the alert icon
      // shows instead of the info if there is an error
      fields[i].setModified(true);

      // Collect errors along the way
      var valid = fields[i].validate();
      
      // Check if field has validated AND
      // if it is a required field
      if (!valid) {
          // If field isn't required, but is filled out and invalid OR field is required - halt!
          if( (!fields[i].isRequiredField() && fields[i].value != null) || fields[i].isRequiredField() ) {
            errors[errors.length] = fields[i];
            errorsE[errorsE.length] = fields[i].getDOMElement();           
          }
      }
    }

    // If an element was found, move the focus to it
    // and display the error
    if (errors[0]) {
      errorsE[0].focus();
      
      this.handleErrors(errors);      
      return false;
    }

    // Disable the buttons and submit!
    var buttons = form.getElementsByTagName("input");
    for (i = 0; i < buttons.length; i++) {
      if (buttons[i].type == 'submit') {
        buttons[i].disabled = true;
        buttons[i].value = 'Please wait...';
      }
    }
    return true;
  };
  
  /**
   * Apply the focus to the first form and first field (input) of the page.
   * 
   * @function {public void} applyFocus
   * @return void
   */
  this.applyFocus = function() {
    // @todo: fix this (what about select boxes etc?)
    if(this.options.autoFocus === true) {
      var inputs = document.getElementsByTagName('input');
      
      for(var i in inputs) {
    	  if(inputs[i].type != 'hidden') {
    		  inputs[i].focus(); 
    		  return true; 
    	  }
      }     
    }
  };
  
  /**
   * Get a field by it's name, note that this does not return the DOM element. 
   * (you can get this by calling getDOMElement() on a positive result however).
   * 
   * @function {private AbstractFormField} getFieldByName
   * @param {String} name The name attribute of the element
   * @return The AbstractFormField Element field if found, otherwise null
   */
  this.getFieldByName = function(name) {	  
    var field = null;
    for ( var i = 0; i < fields.length; i++) {
      if (fields[i].getDOMElement().name == name) {
        return fields[i];
      }
    }

    return field;
  };

  /**
   * Add validation to the form.
   * 
   * Read the form XHTML object into an Chaos.forms.validation.Form Object 
   * and add the validation and context functions to the inputs.
   * 
   * @function {public void} doForm
   * @return void
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
      _du.addEvent(form, 'reset', this.reset.gbind(this));
    }
  };

  /**
   * Apply the validator objects to a field
   * 
   * @function {public void} doFormField
   * @param {DOMElement} input The form input/field to add validation to
   * @return void
   */
  this.doFormField = function(field) {

    // Check type, must be a form element
    if (field && field.type == 'text' || field.type == 'password' || field.type == 'textarea' || field.type == 'select-one' || field.type == 'select-multiple' || field.type == 'checkbox' || field.type == 'file' || field.type == 'radio') {      
      
      // Only apply validation if field is not already being monitored
      if (!this.getFieldByName(field.name)) {
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

/**
 * The GValidator object finds any forms on the page with classname 'autoform' or 'gform' and attaches validation events to the inputs based on class names of the elements. If the element is a required item a * is automatically placed beside the form item and the validation script will ensure it is completed
 * 
 * @class ONEGEEK.forms.GValidator
 */
ONEGEEK.forms.GValidator = function() {

  /**
   * The set of forms to apply validation to
   * 
   * @var {ONEGEEK.forms.Form[]} gForms
   */
  var gForms = [];
  
  /**
   * Get all ONEGEEK.forms.Form's under management.
   *  
   * @function {Array<ONEGEEK.forms.Form>} getGForms
   * @return {Array<ONEGEEK.forms.Form>} The set of forms that are currently being automated.
   */
  this.getGForms = function() {
	return gForms;  
  };

  /**
   * Get a specific ONEGEEK.forms.Form's by the DOM Form's id.
   *  
   * @function {ONEGEEK.forms.Form|null} getGForm
   * @param {String} id The id of the form to fetch.
   * @return {ONEGEEK.forms.Form|null} The ONEGEEK.forms.Form if found, else null.
   */  
  this.getGForm = function(id) {
	  for (var i = 0; i < gForms.length; i++) {
		  var f = gForms[i].getForm();
		  if (f && f.id == id) {
			  return gForms[i];
		  }
	  }
  };
  
  /**
   * Read in any user-defined plug-ins.
   * 
   * Must come from a user created ONEGEEK.forms.GValidator.plugin variable.
   * 
   * @function {public void} readPlugins
   * @return void
   */  
  this.readPlugins = function() {
    // Add each detected plugin to the form field registry 
    for(var item in ONEGEEK.forms.GValidator.plugins) {
      formFieldFactory.registerFormField(item,ONEGEEK.forms.GValidator.plugins[item]._extends, ONEGEEK.forms.GValidator.plugins[item]);
    }
  };
  
  /**
   * Apply focus to the first input element of the first form. 
   * Is called after validation has been applied...
   * 
   * @function {public void} applyFocus
   * @return void
   */
  this.applyFocus = function() {
    if(gForms.length > 0) {
      gForms[0].applyFocus();
    }
  };
  
  /**
   * Automatically apply form validation functions to any {autoform,gform} class.
   * 
   * @function {public void} autoApplyFormValidation
   * @return void
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
    
    // Fixes IE issue that input element isn't rendered in time
    setTimeout(function() {this.applyFocus();}.gbind(this), 500);
  };
  
  // Initialize Plugins
  this.readPlugins();  
};

// Open translation NS
if(typeof(ONEGEEK.forms.GValidator.translation) == 'undefined') {
  ONEGEEK.forms.GValidator.translation = {};
}

/**
 * Add load event function.
 * 
 * @function {public void} addLoadEventGVal
 * @param {Function} func The function to add to the window.onload function
 * @return void 
 */
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