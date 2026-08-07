---
title: "Mastering @PickList: Utilizing Selection Dialogs in HCL Notes"
description: "Learn how to use the @PickList function in HCL Notes to display custom views or name dialogs, allowing users to select documents or names and apply the selections to forms or button actions."
pubDate: "2026-08-08T07:35:42+08:00"
lang: "en"
slug: "notes-formula-picklist"
tags:
  - "Tutorial"
  - "Formula"
  - "Notes Client"
sources:
  - title: "@PickList (Formula Language)"
    url: "https://www.ibm.com/docs/en/domino-designer/10.0.1?topic=functions-picklist-formula-language"
  - title: "Examples: @PickList"
    url: "https://www.ibm.com/docs/da/SSVRGU_8.5.3/com.ibm.designer.domino.main.doc/H_EXAMPLES_PICKLIST.html"
draft: true
---
<!--
REJECTED DRAFT — Article validation failed:
  - At least one source should come from a trusted Domino-related host. Got: https://www.ibm.com/docs/en/domino-designer/10.0.1?topic=functions-picklist-formula-language, https://www.ibm.com/docs/da/SSVRGU_8.5.3/com.ibm.designer.domino.main.doc/H_EXAMPLES_PICKLIST.html
  - Inline-link diversity check failed: "https://www.ibm.com/docs/en/domino-designer/10.0.1?topic=functions-picklist-formula-language" appears 2/4 times in inline links (>=40%). Likely a copy-paste error — each anchor should point to its own destination.
attempt: 2
slug: notes-formula-picklist
-->

## What is @PickList?

`@PickList` is a formula language function in HCL Notes that enables developers to display a dialog box, allowing users to select one or more items from a specified view or list of names. This function is particularly useful when user interaction is required to choose specific data.

## Syntax of @PickList

The `@PickList` function has several syntax forms, with the most common being:

```plaintext
@PickList( [CUSTOM] : [SINGLE] ; server : file ; view ; title ; prompt ; column ; categoryname )
```

- `[CUSTOM]`: Keyword indicating the display of a custom view.
- `[SINGLE]`: Optional keyword that limits the user to selecting a single document.
- `server`: Name of the server.
- `file`: Path and filename of the database.
- `view`: Name of the view to display.
- `title`: Title of the dialog box.
- `prompt`: Prompt text inside the dialog box.
- `column`: Column number to return.
- `categoryname`: Optional; specifies the category name to display.

## Usage Examples

1. **Display a Products View for User Selection**

   ```plaintext
   choice := @PickList( [CUSTOM] ; "" ; "Products" ; "Select a product" ; "Please select the products you want to order" ; 1 );
   ```

   This example displays the "Products" view in the current database, allowing users to select products and returning the value from the first column.

2. **Limit User to Single Document Selection**

   ```plaintext
   choice := @PickList( [CUSTOM] : [SINGLE] ; "" ; "Products" ; "Select a product" ; "Please select the products you want to order" ; 1 );
   ```

   Here, the `[SINGLE]` keyword restricts the user to selecting only one product.

3. **Display Items from a Specific Category**

   ```plaintext
   choice := @PickList( [CUSTOM] ; "" ; "By Category" ; "Select a product" ; "Please select the products you want to order" ; 1; "Leather");
   ```

   This example shows items under the "Leather" category in the "By Category" view.

4. **Display Name Dialog for Selecting People or Groups**

   ```plaintext
   FIELD person := person;
   @SetField( "person"; @PickList( [NAME] ) )
   ```

   This example displays a name dialog, allowing users to select people, groups, or servers, and places the selected names into the "person" field.

## Important Considerations

- The `@PickList` function is suitable for button, manual agent, paste agent, form action, and view action formulas. It is not applicable in field, selection, mail agent, scheduled agent, hide-when, window title, or form formulas.
- This function cannot be used in web applications.
- The amount of data returned is limited to 64KB.

By leveraging the `@PickList` function, developers can easily implement user interactions in HCL Notes, enhancing the flexibility and usability of applications. For more detailed information, refer to [@PickList (Formula Language)](https://www.ibm.com/docs/en/domino-designer/10.0.1?topic=functions-picklist-formula-language) and [Examples: @PickList](https://www.ibm.com/docs/da/SSVRGU_8.5.3/com.ibm.designer.domino.main.doc/H_EXAMPLES_PICKLIST.html).
