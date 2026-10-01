---
title: "Using NotesPropertyBroker's SetPropertyValue Method for Composite Application Communication"
description: "A deep dive into utilizing the SetPropertyValue method of NotesPropertyBroker in LotusScript to facilitate communication between composite application components."
pubDate: "2026-10-01T09:51:44+08:00"
lang: "en"
slug: "notespropertybroker-setpropertyvalue"
tags:
  - "Tutorial"
  - "LotusScript"
  - "Domino Designer"
sources:
  - title: "SetPropertyValue (NotesPropertyBroker - LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/11.0.0/appdev/builds/H_PROPERTYBROKER_SETPROPERTYVALUE_METHOD.html"
  - title: "NotesPropertyBroker (LotusScript)"
    url: "https://help.hcl-software.com/dom_designer/11.0.0/appdev/builds/H_NOTESPROPERTYBROKER_CLASS.html"
  - title: "Composite Applications - Design and Management"
    url: "https://help.hcl-software.com/dom_designer/14.0.0/basic/H_COMPOSITE_APPLICATIONS_OVERVIEW.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - Inline-link diversity check failed: "https://help.hcl-software.com/dom_designer/11.0.0/appdev/builds/H_PROPERTYBROKER_SETPROPERTYVALUE_METHOD.html" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: notespropertybroker-setpropertyvalue
-->

## Introduction

In HCL Domino Designer, composite applications enable different components to communicate with each other, providing a richer user experience. The `NotesPropertyBroker` class plays a pivotal role in this communication by allowing developers to set specific property values using its `SetPropertyValue` method, thereby facilitating data exchange between components.

## Overview of the `SetPropertyValue` Method

The `SetPropertyValue` method is used to set the value of a specified property. The property must be defined in the WSDL, and after setting, it must be published; otherwise, the new value will be lost. The syntax is as follows:

```lotusscript
Call notesPropertyBroker.SetPropertyValue(name, value)
```

- `name`: String. The name of the property whose value will be set.
- `value`: String. The new value of the property.

It's important to note that this method is inactive when called by applications running on the Domino server or on the Notes basic configuration; it is only active in the Notes standard configuration.

## Implementation Example

The following example demonstrates how to use the `SetPropertyValue` method in LotusScript to set a property value and publish it.

```lotusscript
Sub SetAndPublishProperty()
    Dim session As New NotesSession
    Dim workspace As New NotesUIWorkspace
    Dim propertyBroker As NotesPropertyBroker
    
    Set propertyBroker = workspace.PropertyBroker
    
    ' Set property value
    Call propertyBroker.SetPropertyValue("Status", "Approved")
    
    ' Publish property
    Call propertyBroker.Publish
End Sub
```

In this example, the `SetPropertyValue` method sets a property named "Status" to "Approved". Subsequently, the `Publish` method is called to ensure that other components can receive the updated value.

## Considerations

- **Property Definition**: Ensure that the property you intend to set is defined in the WSDL; otherwise, errors may occur.
- **Publishing Properties**: After setting a property value, you must call the `Publish` method; failing to do so will prevent other components from receiving the new value.
- **Execution Environment**: The `SetPropertyValue` method is inactive when called by applications running on the Domino server or on the Notes basic configuration; it is only active in the Notes standard configuration.

## Conclusion

By leveraging the `SetPropertyValue` method of the `NotesPropertyBroker` class, developers can effectively facilitate communication between components in composite applications using LotusScript. Properly setting and publishing properties ensures data synchronization across components, enhancing the overall functionality and user experience of the application.

For more information, refer to the [official documentation for the SetPropertyValue method](https://help.hcl-software.com/dom_designer/11.0.0/appdev/builds/H_PROPERTYBROKER_SETPROPERTYVALUE_METHOD.html) and the [NotesPropertyBroker class](https://help.hcl-software.com/dom_designer/11.0.0/appdev/builds/H_NOTESPROPERTYBROKER_CLASS.html).
