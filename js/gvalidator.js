///////////////////////////////////////////////////////////////////////////////////
// GValidator - JavaScript Form Validation Library
// 
// Author       - Matt Fellows, OneGeek Software (http://www.onegeek.com.au)
// License      - GNU Public License v3 (license.txt)
// Version      - 0.1
// Dependancies - none
///////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////////
// Package ONEGEEK  
///////////////////////////////////////////////////////////////////////////////////

/**
 * Create the ONEGEEK global namespace object
 */
if (typeof(ONEGEEK) == "undefined" || !window.ONEGEEK) {
    /**
     * The ONEGEEK global namespace object.  If ONEGEEK is already defined, the
     * existing ONEGEEK object will not be overwritten so that defined
     * namespaces are preserved.
     * @class ONEGEEK
     * @static
     */
    ONEGEEK = {};
}

///////////////////////////////////////////////////////////////////////////////////
// Package ONEGEEK.forms 
///////////////////////////////////////////////////////////////////////////////////

/**
 * Register the forms package namespace if it doesn't exist
 */
if(typeof ONEGEEK.forms == "undefined") {
  ONEGEEK.forms = {};
  
  // Constants: Edit to suit your environment
  ENABLE_AUTO_FORM_VALIDATION = true;
  ENABLE_COMPACT_MESSAGES     = true;  // Shows a link to a popup message if true, otherwise always shows the message
  
  // Image constants
  ICON_DIR     = '../images/icons/';
  ICON_ERROR   = ICON_DIR+'cross.png';
  ICON_OK      = ICON_DIR+'tick.png';
  ICON_INFO    = ICON_DIR+'help.png';
  ICON_ALERT   = ICON_DIR+'icon_alert.gif';
  
  // Field Status Constants
  FIELD_STATUS_ERROR = 1;
  FIELD_STATUS_OK    = 2;
  FIELD_STATUS_INFO  = 3;
  FIELD_STATUS_NONE  = 4;
}

/////////////////////////////////////////////
// Start DOM Utilities Class Definition    //
/////////////////////////////////////////////

/**
 * General DOM manipulation utilities
 * needed for this library
 */
ONEGEEK.forms.DOMUtilities = function() {
  
  /**
   * Get the x and y coordinates of an element relative to the top left
   * corner of the window
   * 
   * @param {Object} obj The source element
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
    return [curleft,curtop];
  };
  
  /**
   * Popup / Hide an element at the location of the click 
   * 
   * @param {Object} source The source element that is sending the request
   * @param {Object} target The target element to show/hide 
   */
  this.togglePopup = function(source, target) {
    var div = target;
    var coords = this.findPos(source);
    if(div.style.display == 'block') {
      div.style.display = 'none'; 
    } else {
      div.style.position = 'absolute';
      div.style.left = coords[0]+10+'px';
      div.style.top = coords[1]-6+'px';
      div.style.display = 'block';
     }
  }; 
      
  /**
   * Check if an element belongs to a certain class
   * @param {Object} element The element to check
   * @param {Object} class The class to check against the element
   */
  this.doesElementBelongToClass = function(element, className) {
    var classes = element.className;
    var pattern = new RegExp(className, 'g');

    if(pattern.test(classes)) {
      return true;
    }
    return false;
    
  };
  
  /**
   * Remove a class name from an element
   * 
   * @param {Object} element The element to check
   * @param {Object} className The class to remove from the element
   */
  this.removeClass = function(element, className) {   
    var classes = element.className;
    var regex = '\b'+className+'\b';
    element.className = classes.replace(className, ''); 
  };
  
  /**
   * Add a class name to an element
   * 
   * @param {Object} element The element to check
   * @param {Object} class The class to add to the element
   */
  this.addClass = function(element, className) {
    var classes = element.className;
      
    if(!this.doesElementBelongToClass(element, className)) {
      element.className += " "+className;
    }
  };
  
	/** 
	 * Attach an event to an element. Handles for most browsers
	 * NB. To make it work in crappy old browsers assign the element an id
	 */
	this.addEvent = function(element, event, handler) {
	  if(element.attachEvent) {                           // IE (6+?)
	    element.attachEvent('on'+event, handler);
	  } else if(element.addEventListener) {               // Most nice browsers
	    element.addEventListener(event, handler, false);
	  } else {                                            // Old browsers
	    // Assign an id based on the time for this element if it has no id
	    if(!element.id) {
	      var date = new Date();
	      element.id = date.getTime();
	    }
	    eval('document.getElementById('+ element.id +').on'+event+'='+handler);             
	  }
	};
 
};

// Create a global (quasi-singleton) instance of the factory
var util = new ONEGEEK.forms.DOMUtilities();

/////////////////////////////////////////////
// Start FormField Class Definition        //
/////////////////////////////////////////////

/**
 * Abstract Form Field object.
 * Has the necessary functions to access, validate and clean 
 * a form elements' data
 * 
 * This class should NOT be instantiated. Subclass and
 * override these methods
 */
ONEGEEK.forms.AbstractFormField = function(field) {
  this.name  = '';             // name
  this.field = field || null; // DOM element

  this.successMessage = 'Completed'; // Messages displayed to user on successful completion
  this.errorMessage = 'Please complete';   // Messages displayed to user on completion error
  this.contextMessage = 'Please complete';  // Messages displayed to user when they are filling out field
  this.messageSpan = null;   // The span to display field errors, messages, validation etc.
  this.isRequired = false;   // Is this field required?
  this.statusImg = null;     // The image for the status icon span 
  this.statusLink = null;    // The link for the status icon
  this.fieldStatus = null;   // The status field span (<span><a><img/></a></span>)
  this.modified = false;     // has the field been modified?
  
  // Add the Icons, spans and validation events
  this.setup = function() {
    this.getMessageSpan();    
    if(ENABLE_COMPACT_MESSAGES) {
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
   * Sets the fields' modified status to true
   */
  this.applyFieldModification = function(field) {
    return function() {
      field.setModified(true);
    };
  };
  
 /**
   * Applies field context information
   * for form inputs. Only show the first time 
   * 
   * @param {Object} field The FormField object
   * @param return A function to display context information to the user
   */ 
  this.applyContextInformation = function(field) {   
    return function() {
      var msgSpan = field.getMessageSpan(); // Span field to display info about state of field

      // If the field hasn't been used yet and there is a context message
      if(msgSpan && field.getModified() === false && field.getDOMElement.value === '' && field.getContextMessage()) { 
        field.setState(FIELD_STATUS_INFO);
      }     
    };      
  }; 
  
  /**
   * Applies inline field validation
   * for form inputs 
   * 
   * @param {Object} field The FormField object
   * @param return A function to validate the item
   */
  this.applyFieldValidation = function(field) {   
    return function() {
      field.validate();     
    };
  };        
      
  /**
   * Get a new instance of this object
   * This is used for the FormFieldFactory to lookup and
   * create objects
   * 
   * @param {Object} field The DOM element (field) 
   * @see ONEGEEK.forms.FormField
   * @override 
   */
  this.getNewInstance = function(field) {
    return new ONEGEEK.forms.AbstractFormField(field);
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
   * Set the state of the field. This will show the
   * relevant icons and error messages for the field
   * 
   * @param {Object} state The fields' state. Can be one of:
   * FIELD_STATUS_ERROR,
   * FIELD_STATUS_OK,
   * FIELD_STATUS_INFO
   */
  this.setState = function(state) { 
  
    // Remove previous messages
    util.removeClass(this.messageSpan, 'error');  
    util.removeClass(this.messageSpan, 'info');
    util.removeClass(this.messageSpan, 'ok');
    util.removeClass(this.messageSpan, 'hidden');
    
    // Hide the message always if in COMPACT mode
    if(ENABLE_COMPACT_MESSAGES) {
      util.addClass(this.messageSpan, 'hidden');  
    }
    
    var src = '';
    var title = '';
    var alt = '';
          
    var message = null;
    switch(state) {
      case FIELD_STATUS_ERROR:
        src = ICON_ALERT;
        alt = 'There are errors with this field. Click for more info.';
        title = 'There are errors with this field. Click for more info.';
        message = this.errorMessage;
        util.addClass(this.messageSpan, 'error');
        break;
      case FIELD_STATUS_OK:
        src = ICON_OK;
        alt = 'This field has been completed successfully.';
        title = 'This field has been completed successfully.';
        message = this.successMessage;
        util.addClass(this.messageSpan, 'ok');
        break;
      default:
       src = ICON_INFO;
       alt = 'Click for more information about this field.';
       title = 'Click for more information about this field.';
       message = this.contextMessage;
       util.addClass(this.messageSpan, 'info');
    }   
    
    if(ENABLE_COMPACT_MESSAGES) {
        this.statusImg.src = src;
        this.statusImg.alt = alt;
        this.statusImg.title = title;     
    }
    
    // Display / Hide Message      
    if(message !== null) {
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
    if(this.isRequired) {   
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
    if(this.fieldStatus === null) {      
      // Get the icon object
      var msgSpans = this.field.parentNode.getElementsByTagName('span');        
      for(var i=0;i<msgSpans.length;i++) {        
        if(util.doesElementBelongToClass(msgSpans[i], 'fieldstatus')) {
          this.fieldStatus = msgSpans[i];
          return this.fieldStatus; 
        }
      }
      
      // None found - create a new one!
      var span = document.createElement('span');
      span.className = 'fieldstatus';
      
      // Image
      this.statusImg = document.createElement('img');
      this.statusImg.src = ICON_INFO;
      
      // Link
      this.statusLink = document.createElement('a');
      //this.statusLink.href = "";
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
    if(this.messageSpan === null) {      
      // Get the MsgSpan object - This is where the form field gets a message
      var msgSpans = this.field.parentNode.getElementsByTagName('span');        
      for(var i=0;i<msgSpans.length;i++) {        
        if(util.doesElementBelongToClass(msgSpans[i], 'msg')) {
          this.messageSpan = msgSpans[i];
          return this.messageSpan; 
        }
      }
      // None found - create a new one!
      var span = document.createElement('span');
      
      if(!ENABLE_COMPACT_MESSAGES) {
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
   * Validate the field. 
   * Defaults to returning true if there is a value for the field
   * @return true if there is a value, false if not
   */
  this.validate = function() {
    if(this.field.value) {
      this.setState(FIELD_STATUS_OK);
      return true;
    }
    
    if(this.modified === false){
      this.setState(FIELD_STATUS_INFO); 
    } else {
      this.setState(FIELD_STATUS_ERROR);  
    }   
    
    return false;
  };
  
  /**
   * Clean the field. This provides no default implementation
   * and should be overriden
   */
  this.clean = function() {};
  
  /**
   * Set the fields name
   */
  this.setName = function(name) {
    this.name = name;
  };
    
  /**
   * Get the fields name
   */
  this.getName = function() {
    return this.name;
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

  /** Return context information about a particular field
   * i.e. "A username should be between 5 and 10 characters
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

/////////////////////////////////////////////
// Start FormFieldFactory Class Definition //
/////////////////////////////////////////////

/**
 * The Form Field Factory provides a way to lookup a specific type of
 * FormField subclass without having to know the concreate class name in advance
 * 
 * i.e. To get a FormField object associated with the 'phone' class
 * try: factory.lookup('phone', field) ;
 */
ONEGEEK.forms.FormFieldFactory = function() { 
  var formFieldRegister = new Array(); 
  
  /**
   * Lookup a form field object from the list
   * of registered FormField objects
   * 
   * @param {Object} name The class name of the field
   * @param {Object} field The DOM form field element 
   */
  this.lookupFormField = function(name, field) {	 
    if(formFieldRegister[name] != null)  {
      return formFieldRegister[name].getNewInstance(field);
    }
  };
  
  /**
   * Register a FormField subclass with the factory
   * 
   * @param {Object} name The name of elements class associated with the FormField i.e. 'firstname'
   * @param {Object} field The FormField concrete subclass i.e. NameField
   */
  this.registerFormField = function(name, field) {
    // Make sure the field is of type FormField 
    if(field instanceof ONEGEEK.forms.AbstractFormField) {     
      // Make sure the name doesn't collide
      if(formFieldRegister[name] != null) {
        alert('FormFieldFactory registerFormField(): Cannot register field, as this namespace is in use');
        return;
      }     
      formFieldRegister[name] = field;
    } else {
      alert('FormFieldFactory registerFormField(): Cannot register field, as this object is not of type FormField');
    }
  };
};

// Create a global (quasi-singleton) instance of the factory
var formFieldFactory = new ONEGEEK.forms.FormFieldFactory();

/////////////////////////////////////////////
// Start AbstractComboBox Class Definition //
/////////////////////////////////////////////

/**
 * Abstract Combo Box provides a default implementation for
 * combo box 
 * 
 * This class should NOT be instantiated. Subclass and
 * override these methods
 * 
 * @param {Object} field
 */
ONEGEEK.forms.AbstractComboBox = function(field) {
  this.name = "select";
  this.field = field;
  
  /**
   * Get a new instance of this object
   * This is used for the FormFieldFactory to lookup and
   * create objects
   * 
   * @param {Object} field The DOM element (field) 
   * @see ONEGEEK.forms.FormField
   * @override 
   */
  this.getNewInstance = function(field) {
    return new ONEGEEK.forms.AbstractComboBox(field);
  };
  
  /**
   * Override the validation function
   *  
   * Defaults to returning true if there is a value for the field and showing
   * success otherwise it shows the context information icon
   * 
   * @return true if there is a value, false if not
   */
  this.validate = function() {
    if(this.field.value && this.field.value !== '') {
      this.setState(FIELD_STATUS_OK);
      return true;
    }    
    if(this.modified === false){
      this.setState(FIELD_STATUS_INFO); 
    }   
    
    return false;
  };
  
  /**
   * Override setup function.
   */
  this.setup = function() {
    this.getMessageSpan();    
    if(ENABLE_COMPACT_MESSAGES) {
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

/////////////////////////////////////////////
// Start GenericComboBox Class Definition  //
/////////////////////////////////////////////

/**
 * Generic Combo Box provides a default implementation
 * for a combo box
 * 
 * @param {Object} field
 */
ONEGEEK.forms.GenericComboBox = function(field) {
  this.field = field;
  
  /**
   * Get a new instance of this object
   * This is used for the FormFieldFactory to lookup and
   * create objects
   * 
   * @param {Object} field The DOM element (field) 
   * @see ONEGEEK.forms.FormField
   * @override 
   */
  this.getNewInstance = function(field) {
    return new ONEGEEK.forms.GenericComboBox(field);
  };   
};

// Inherits from the AbstractComboBox
ONEGEEK.forms.GenericComboBox.prototype = new ONEGEEK.forms.AbstractComboBox();

// Register the select class with the factory
formFieldFactory.registerFormField('select', new ONEGEEK.forms.GenericComboBox());
formFieldFactory.registerFormField('combo', new ONEGEEK.forms.GenericComboBox());

/////////////////////////////////////////////
// Start RequiredComboBox Class Definition  //
/////////////////////////////////////////////

/**
 * Required Combo Box provides a default required implementation
 * for a combo box
 * 
 * @param {Object} field
 */
ONEGEEK.forms.RequiredComboBox = function(field) {
  this.field = field;
  this.isRequired = true;
  
  /**
   * Get a new instance of this object
   * This is used for the FormFieldFactory to lookup and
   * create objects
   * 
   * @param {Object} field The DOM element (field) 
   * @see ONEGEEK.forms.FormField
   * @override 
   */
  this.getNewInstance = function(field) {
    return new ONEGEEK.forms.RequiredComboBox(field);
  }; 
  
  /**
   * Calls parent validation function and sets status accordingly
   * 
   * @return true if there is a value, false if not
   */
  this.validate = function() {
	var result = ONEGEEK.forms.AbstractComboBox.prototype.validate.call(this);
	// If result is false and has been modified, set error state
	if(!result) {
	    if(this.modified === true) {
	      this.setState(FIELD_STATUS_ERROR); 
	    }   				
	}
	return result;
  };  
};

// Inherits from the AbstractComboBox
ONEGEEK.forms.RequiredComboBox.prototype = new ONEGEEK.forms.AbstractComboBox();

// Register the select class with the factory
formFieldFactory.registerFormField('requiredselect', new ONEGEEK.forms.RequiredComboBox());
formFieldFactory.registerFormField('requiredcombo', new ONEGEEK.forms.RequiredComboBox());

/////////////////////////////////////////////
// Start AbstractCheckbox Class Definition //
/////////////////////////////////////////////

/**
 * Abstract CheckBox Button provides a default implementation for
 * 
 * This class should NOT be instantiated. Subclass and
 * override these methods
 * 
 * @param {Object} field
 */
ONEGEEK.forms.AbstractCheckbox = function(field) {
  this.field = field;
  this.name = "checkbox";
    
  /**
   * Override clean operation to do nothing
   */ 
  this.clean = function() {};
  
  /**
   * Override validation function:
   * 
   */
  this.validate = function() {
    // Check if the form has a value set for this checkbox
    // by cycling through all of the checkboxes
    var elements = document.forms[0].elements[this.field.name];
    for(i = 0; i < elements.length; i++) {
      if(elements[i].checked) {
        this.setState(FIELD_STATUS_OK);
        return true;
      } else {
        if(this.modified !== true) {
          this.setState(FIELD_STATUS_INFO);
        } else {
          this.setState(FIELD_STATUS_ERROR);
        }
      }
    }
    return false;
  };
  
  /**
   * Override the setup function: 
   * The validation events need to be applied to ALL of the checkboxes
   *
   */
  this.setup = function() {
      this.getMessageSpan();    
    if(ENABLE_COMPACT_MESSAGES) {
      this.createFieldStatusIcon(); 
    }   
      this.createRequiredSpan();  
    this.validate();

    // Add events to ALL of the items   
    var elements = document.forms[0].elements[this.field.name];
    for(i = 0; i < elements.length; i++) {
		util.addEvent(elements[i], 'click', this.applyFieldValidation(this));
		util.addEvent(elements[i], 'click', this.applyContextInformation(this));
		util.addEvent(elements[i], 'change', this.applyFieldModification(this));     
    }
  };
};

// Inherits from the AbstractFormField
ONEGEEK.forms.AbstractCheckbox.prototype = new ONEGEEK.forms.AbstractFormField();

////////////////////////////////////////////////
// Start GenericCheckbox Class Definition  //
////////////////////////////////////////////////

/**
 * Generic CheckBox provides a default implementation
 * for a Check box group
 * 
 * @param {Object} field
 */
ONEGEEK.forms.GenericCheckbox = function(field) {
  this.field = field;
  this.isRequired = true;   // Is this field required?  
  
  /**
   * Return a new instance of NameField
   * @param {Object} field The DOM element (field)
   */
  this.getNewInstance = function(field) {
    return new ONEGEEK.forms.GenericCheckbox(field);
  }; 
};

// Inherits from the AbstractComboBox
ONEGEEK.forms.GenericCheckbox.prototype = new ONEGEEK.forms.AbstractCheckbox();

// Register the field type with FormFieldFactory
formFieldFactory.registerFormField('checkbox', new ONEGEEK.forms.GenericCheckbox());

/////////////////////////////////////////////
// Start AbstractRadioButton Class Definition //
/////////////////////////////////////////////

/**
 * Abstract Radio Button provides a default implementation for
 * radio
 * 
 * This class should NOT be instantiated. Subclass and
 * override these methods
 * 
 * @param {Object} field
 */
ONEGEEK.forms.AbstractRadioButton = function(field) {
  this.field = field;
  this.name = "radio";
    
  /**
   * Override clean operation to do nothing
   */ 
  this.clean = function(){};
  
  /**
   * Override the setup function: 
   * The validation events need to be applied to ALL of the checkboxes
   *
   */
  this.setup = function() {
      this.getMessageSpan();    
    if(ENABLE_COMPACT_MESSAGES) {
      this.createFieldStatusIcon(); 
    }   
      this.createRequiredSpan();  
    this.validate();

    // Add events to ALL of the items   
    var elements = document.forms[0].elements[this.field.name];
    for(i = 0; i < elements.length; i++) {
		util.addEvent(elements[i], 'click', this.applyFieldValidation(this));
		util.addEvent(elements[i], 'click', this.applyContextInformation(this));
		util.addEvent(elements[i], 'change', this.applyFieldModification(this));       
    }
  }; 
  /**
   * Override validation function:
   * 
   */
  this.validate = function() {
    // Check if the form has a value set for this checkbox
    // by cycling through all of the checkboxes
    var elements = document.forms[0].elements[this.field.name];
    for(i = 0; i < elements.length; i++) {
      if(elements[i].checked) {
        this.setState(FIELD_STATUS_OK);
        return true;
      } else {
        if(this.modified !== true) {
          this.setState(FIELD_STATUS_INFO);  
        } else {
          this.setState(FIELD_STATUS_ERROR);
        }
      }
    }
    return false;
  };      
};

// Inherits from the AbstractFormField
ONEGEEK.forms.AbstractRadioButton.prototype = new ONEGEEK.forms.AbstractFormField();

////////////////////////////////////////////////
// Start GenericRadioButton Class Definition  //
////////////////////////////////////////////////

/**
 * Generic Radio Button provides a default implementation
 * for a Radio Button
 * 
 * @param {Object} field
 */
ONEGEEK.forms.GenericRadioButton = function(field) {
  this.field = field;
  this.isRequired = true;
  
  /**
   * Return a new instance of NameField
   * @param {Object} field The DOM element (field)
   */
  this.getNewInstance = function(field) {
    return new ONEGEEK.forms.GenericRadioButton(field);
  }; 
};

// Inherits from the AbstractComboBox
ONEGEEK.forms.GenericRadioButton.prototype = new ONEGEEK.forms.AbstractRadioButton();

// Register the field type with FormFieldFactory
formFieldFactory.registerFormField('radio', new ONEGEEK.forms.GenericRadioButton());

//////////////////////////////////////////////
// Start AbstractTextField Class Definition //
//////////////////////////////////////////////

/**
 * Abstract TextField object representing a basic form text field.
 * 
 * Provides the basic validation implementations for a TextField or a TextArea
 * This class should not be instantated directly. Use a concrete subclass instead
 * 
 * @param {Object} field The XHTML DOM field element
 */
ONEGEEK.forms.AbstractTextField = function(field) {
  this.regex = '';           // regex to match if ok
  this.cleanRegex = '';      // regex to clean naughty chars
  this.pattern = null;       // Pattern that uses regex to match
  
  /**
   * Overrides the validate function. 
   * Defaults to evaluating a regular expression
   * @return true or false
   */
  this.validate = function() {
    if(this.field.value) {
      this.clean();
      this.pattern = new RegExp(this.regex);
      var validated = this.pattern.test(this.field.value);
      
      // Check if field passes and show message   
      if(validated) {  
        this.setState(FIELD_STATUS_OK);  
      } else {
        this.setState(FIELD_STATUS_ERROR);     
      }
      return validated;
    }
    if(this.modified === false){
      this.setState(FIELD_STATUS_INFO); 
    } else {
      this.setState(FIELD_STATUS_ERROR);  
    }   
    
    return false;
  };
  
  /**
   * Overrides the clean function. Defaults to removing
   * illegal chars 
   */
  this.clean = function() {
    this.field.value = this.field.value.replace(this.cleanRegex,'');
  };
};

// Inherits from the AbstractFormField
ONEGEEK.forms.AbstractTextField.prototype = new ONEGEEK.forms.AbstractFormField();

/////////////////////////////////////////////
// Start NameField Class Definition        //
/////////////////////////////////////////////

/**
 * Name Field (Extends FormField).
 * 
 * Validate a last name, or first name field with the constraints:
 * - Between 4 and 20 chars
 * - Only letters, spaces, hyphens and apostrophe's
 * - Field is required
 *  
 */
ONEGEEK.forms.NameField = function(field) {
  this.field = field;
  this.name = 'name';
  this.regex = /^([a-zA-Z\-\'\s]{2,30})$/g;
  this.cleanRegex = /[^a-zA-Z\-\'\s]/g;
  this.isRequired = true;  
  this.errorMessage   = 'Your name must be between 2 and 30 characters';
  this.contextMessage = 'We would like to call you by your name'; 
  
  /**
   * Return a new instance of NameField
   * @param {Object} field The DOM element (field)
   */
  this.getNewInstance = function(field) {
    return new ONEGEEK.forms.NameField(field);
  };
};

// Subclass FormField
ONEGEEK.forms.NameField.prototype = new ONEGEEK.forms.AbstractTextField();

// Register the field types with FormFieldFactory
formFieldFactory.registerFormField('firstname', new ONEGEEK.forms.NameField());
formFieldFactory.registerFormField('lastname', new ONEGEEK.forms.NameField());
formFieldFactory.registerFormField('name', new ONEGEEK.forms.NameField());

/////////////////////////////////////////////
// Start PhoneField Class Definition        //
/////////////////////////////////////////////

/**
 * Phone Field (Extends FormField).
 * 
 * Validate an australian phone number
 * - Between 8 and 10 chars
 * - Only numbers and spaces allowed
 * - Field is required
 *  
 */
ONEGEEK.forms.PhoneField = function(field) {
  this.field = field;
  this.name = 'phone';
  this.regex = /^([0-9]{8,10})$/g;
  this.cleanRegex = /[^0-9]/g;
  this.isRequired = true;   
  this.errorMessage   = 'Your phone number needs to be at least 8 digits long i.e. 03 1234 5678';
  this.contextMessage = this.errorMessage;
  
  /**
   * Return a new instance of NameField
   * @param {Object} field The DOM element (field)
   */
  this.getNewInstance = function(field) {
    return new ONEGEEK.forms.PhoneField(field);
  };
};
 
// Subclass FormField
ONEGEEK.forms.PhoneField.prototype = new ONEGEEK.forms.AbstractTextField(); 

// Register the field type with FormFieldFactory
formFieldFactory.registerFormField('phone', new ONEGEEK.forms.PhoneField());

/////////////////////////////////////////////
// Start EmailField Class Definition       //
/////////////////////////////////////////////

/**
 * Email Field (Extends FormField).
 * 
 * Validate an email address. RFC characters are allowed
 * but for easy validation for 99% of emails this will work
 * 
 * @see RFC 2822 : http://tools.ietf.org/html/rfc2822 
 * for more details
 */
ONEGEEK.forms.EmailField = function(field) {
  this.field = field;
  this.name = 'email';
  this.regex = /^[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,4}$/i;
  this.isRequired = true; 
  this.errorMessage   = 'Please enter a valid email address i.e. user@domain.com';
  this.contextMessage = 'Your email address will be kept confidential';
  
  /**
   * Return a new instance of NameField
   * @param {Object} field The DOM element (field)
   */
  this.getNewInstance = function(field) {
    return new ONEGEEK.forms.EmailField(field);
  };
  
  /**
   * Override clean() method to do nothing
   */
  this.clean = function() {}; 
};

// Subclass FormField
ONEGEEK.forms.EmailField.prototype = new ONEGEEK.forms.AbstractTextField(); 

// Register the field type with FormFieldFactory
formFieldFactory.registerFormField('email', new ONEGEEK.forms.EmailField());

/////////////////////////////////////////////
// Start GenericTextField Class Definition //
/////////////////////////////////////////////

/**
 * GenericTextField Field (Extends FormField).
 * 
 * Validate a generic text field. Don't allow naughty chars
 * such as <>()
 *  
 */
ONEGEEK.forms.GenericTextField = function(field) {
  this.field = field;
  this.name = 'generic';
  this.cleanRegex = /[<>\/\\\(\);]/g;
  this.isRequired = false;
  
  /**
   * Return a new instance of NameField
   * @param {Object} field The DOM element (field)
   */
  this.getNewInstance = function(field) {
    return new ONEGEEK.forms.GenericTextField(field);
  };
  
  /**
   * Override the validate method: clean the field
   * and always return true as this field is not
   * required
   */
  this.validate = function() {
    this.clean();
    if(this.modified === true && this.field.value !== '') {
      this.setState(FIELD_STATUS_OK); 
    } else {
      this.setState(FIELD_STATUS_INFO);
    }
    
    return true;    
  };
};

// Subclass FormField
ONEGEEK.forms.GenericTextField.prototype = new ONEGEEK.forms.AbstractTextField(); 

// Register the field types with FormFieldFactory
formFieldFactory.registerFormField('text', new ONEGEEK.forms.GenericTextField());
formFieldFactory.registerFormField('generictext', new ONEGEEK.forms.GenericTextField());

/////////////////////////////////////////////////////
// Start GenericRequiredTextField Class Definition //
/////////////////////////////////////////////////////

/**
 * GenericRequiredTextField Field (Extends FormField).
 * 
 * Validate a GenericRequired text field that is mandatory 
 * Don't allow naughty chars such as <>()
 *  
 */
ONEGEEK.forms.GenericRequiredTextField = function(field) {
  this.field = field;
  this.name = 'genericrequired';
  this.cleanRegex = /[<>\/\\\(\);]/g;
  this.isRequired = true;
  
  /**
   * Return a new instance of NameField
   * @param {Object} field The DOM element (field)
   */
  this.getNewInstance = function(field) {
    return new ONEGEEK.forms.GenericRequiredTextField(field);
  };
};

// Subclass FormField
ONEGEEK.forms.GenericRequiredTextField.prototype = new ONEGEEK.forms.AbstractTextField(); 

// Register the field types with FormFieldFactory
formFieldFactory.registerFormField('genericrequiredtext', new ONEGEEK.forms.GenericRequiredTextField());

/////////////////////////////////////////////
// Start CaptchaTextField Class Definition //
/////////////////////////////////////////////

/**
 * CaptchaTextField Field (Extends FormField).
 * 
 * Validate a generic text field. Don't allow naughty chars
 * such as <>()
 *  
 */
ONEGEEK.forms.CaptchaTextField = function(field) {
  this.field = field;
  this.name = 'captcha';
  this.regex = /^([A-Za-z0-9\-_]+)$/g;
  this.cleanRegex = /[<>\/\\\(\);]/g;
  this.isRequired = true;
  
  this.successMessage = "Thankyou...";
  this.errorMessage   = "Please complete the security check";
  this.contextMessage = "This prevents us from spam";
    
  /**
   * Return a new instance of NameField
   * @param {Object} field The DOM element (field)
   */
  this.getNewInstance = function(field) {
    return new ONEGEEK.forms.CaptchaTextField(field);
  };
};

// Subclass FormField
ONEGEEK.forms.CaptchaTextField.prototype = new ONEGEEK.forms.AbstractTextField(); 

// Register the field types with FormFieldFactory
formFieldFactory.registerFormField('captcha', new ONEGEEK.forms.CaptchaTextField());

/////////////////////////////////////////////
// Start RecaptchaTextField Class Definition //
/////////////////////////////////////////////

/**
 * RecaptchaTextField Field (Extends FormField). Provides information
 * relevent to the RECAPTCHA captcha system
 * 
 * Acts like a generic text field. Don't allow naughty chars
 * such as <>()
 *  
 */
ONEGEEK.forms.RecaptchaTextField = function(field) {
  this.field = field;
  this.name = 'recaptcha';
  this.contextMessage = "Need some <a href='javascript:Recaptcha.showhelp()'>help</a>? Get another <a href='javascript:Recaptcha.reload()'>CAPTCHA</a>";
    
  /**
   * Return a new instance of NameField
   * @param {Object} field The DOM element (field)
   */
  this.getNewInstance = function(field) {
    return new ONEGEEK.forms.RecaptchaTextField(field);
  };
};

// Subclass CaptchaTextField
ONEGEEK.forms.RecaptchaTextField.prototype = new ONEGEEK.forms.CaptchaTextField(); 

// Register the field types with FormFieldFactory
formFieldFactory.registerFormField('recaptcha_response_field', new ONEGEEK.forms.RecaptchaTextField());
formFieldFactory.registerFormField('recaptcha', new ONEGEEK.forms.RecaptchaTextField());

/////////////////////////////////////////////
// Start Form Class Definition             //
/////////////////////////////////////////////

/**
 * The form validator object finds any forms on the page
 * and attaches validation events to the inputs based
 * on class names of the <input>'s. 
 * 
 * If the element is a required item a * is automatically
 * placed beside the form item and the validation script will
 * ensure it is filled out
 * 
 * @param {Object} form The form XHTML DOM element OR the form's id
 */
ONEGEEK.forms.Form = function(form) {
  var fields = new Array();                    // Array of fields
  form = form || document.getElementById(form) || null;  // DOM form object
  var completed = false;
  
  /**
   * This function is used to validate the form
   */
  var validate = function() {
    var firstErrorElement = null;
    
    // Call the validate events on each of the inputs
    // To update the status of each field
    for(var i = 0; i < fields.length; i++) {
      // Set the fields status to modified, so the alert icon
      // shows instead of the info if there is an error
      fields[i].setModified(true);
      
      // Highlight any errors along the way
      var valid = fields[i].validate();
      
      // Check if field has validated AND
      // if it is a required field
      if(!valid && fields[i].isRequiredField()) { 
        if(!firstErrorElement) {
          firstErrorElement = fields[i].getDOMElement(); 
        }       
      }
    }
    
    // If an element was found, move the focus to it
    // and display the error
    if(firstErrorElement) {
      firstErrorElement.focus();
      alert('Please correct the highlighted errors.');      
      return false;
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
   * @param {Object} name The name attribute of the element
   */
  var getFieldByName = function(name) {
    var field = null;
    for(var i = 0; i < fields.length; i++) { 
      if(fields[i].getDOMElement().name == name) {
        return fields[i].getDOMElement();
      }
    }
    
    return field;
  };
  
  /**
   * Read the form XHTML object into an ONEGEEK.forms.Form Object
   * and add the validation and context functions to the inputs 
   */ 
  this.doForm = function() {
    if(form) {
      // Add validation events to INPUT fields      
      var inputs = form.getElementsByTagName("input");      
      for(var i = 0; i < inputs.length; i++) {
        doFormField(inputs[i]);
      }

      // Add validation events to TEXTAREA fields
      var textareas = form.getElementsByTagName("textarea");
      for(i = 0; i < textareas.length; i++) {
        doFormField(textareas[i]);
      }   
      
      // Add validation events to SELECT fields
      var selects = form.getElementsByTagName("select");
      for(i = 0; i < selects.length; i++) {
        doFormField(selects[i]);
      }       
      
      // Add validate() call to form
      form.onsubmit = validate;
    }   
  };
  
  /**
   * Apply the validation events to a field 
   * 
   * @param {Object} input The form input/field
   */
  var doFormField = function(field) {
    // Check type
    if(field && field.type == 'text' || field.type == 'textarea' || field.type == 'select-one' || field.type == 'select-multiple' || field.type == 'checkbox' || field.type == 'radio') {
      
      // Only apply validation if field is not already being monitored
      if(!getFieldByName(field.name)) {           
        // Check class names
        var classname = field.className;
        var fieldObject = null;

        // Lookup field from factory for class name
        fieldObject = formFieldFactory.lookupFormField(classname, field);
        if(fieldObject) {           
        
          // Add validation and context functions to field
          var element = fieldObject.getDOMElement();
          fieldObject.setup();
          
          // Add the element to the array
          fields[fields.length] = fieldObject;
        }       
      }                   
    }   
  };
};

//////////////////////////////////////////////
// Start GValidator Class Definition        //
//////////////////////////////////////////////

/**
 * The GValidator object finds any forms on the page
 * with classname 'autoform' or 'gform' and attaches validation events to the inputs based
 * on class names of the elements. 
 * 
 * If the element is a required item a * is automatically
 * placed beside the form item and the validation script will
 * ensure it is completed
 * 
 * @param {Object} form The form XHTML DOM element
 */
ONEGEEK.forms.GValidator = function() {  
  /**
   * Automatically apply form validation functions
   * to any 'autoform'
   */
  this.autoApplyFormValidation = function() {
    var forms = document.getElementsByTagName('form');
    for(i=0;i<forms.length;i++) {
      if(forms[i].className == 'autoform' || forms[i].className == 'gform') {
        // Create the form object
        var form = new ONEGEEK.forms.Form(forms[i]);
        
        // Apply validation
        form.doForm();
      }
    }
  };
};

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
if(ENABLE_AUTO_FORM_VALIDATION) {
  addLoadEventGVal(function() {
    gvalidator = new ONEGEEK.forms.GValidator();
    gvalidator.autoApplyFormValidation();
  });
}