# Javascript Style Guide

This document attempts to codify the javascript code style rules for Fauxton. This has been patched together from
a few sources, including [Pootle's style guide](http://pootle.readthedocs.org/en/latest/developers/styleguide.html#javascript),
[Google JS style guide](https://google-styleguide.googlecode.com/svn/trunk/javascriptguide.xml), and from
reverse-engineering our own codebase.

This is intended to be a living document: any disagreements about style should be brought to the community via IRC,
discussed, agreed upon and documented here.

Note: We have jshint running as a grunt task which will catch the more egregious errors (missing `vars`, missing
semicolons etc). See the `gruntfile.js` for the settings being used.


## Programming Style

#### Object Prototypes
Do not modify any native objects' prototype. eg. `Array.prototype`.

#### Object Constructors
Avoid using constructors for the built-in object types: Number, String, Boolean, Array, Object.

Number:
```javascript
var x = 10; // good
var x = new Number(10); // bad
```

String:
```javascript
var greeting = 'Hello'; // good
var greeting = new String('Hello'); // bad
```

Boolean:
```javascript
var yes = true; // good
var yes = new Boolean(1); // bad
```

Array:
```javascript
var myList = new Array(1, 2, 3); // nope
var myList = [1, 2, 3]; // yay!
```

Object:
```javascript
var myObj = { size: 10 }; // hurrah!
var myObj = new Object(); // boooo!
```

#### Associative Arrays
Use object literal notation for map/hash/associative arrays.

#### Strings
Use `'` single quote character for strings, because HTML markup uses `"`. Eg. `var greeting = 'Hello World!'`;

#### Numbers
When using `parseInt` always explicitly include the second radix argument (usually 10).

#### Avoid changing a variable's type
Once you have create a variable and assigned a value, it is set as a type, stick with that type for that variable. This
has performance benefits as well as making it easier for someone to understand your code.

Bad:
```javascript
var greeting = 'Hello World!';
greeting = function() {
  return 'Goodbye World';
};
```

Special cases for `null` and `undefined` since they're their own type. It's fine to assign a new value to an undefined
or null var.

#### Indentation
- 2-space indentation. Don't use tabs. Jshint will whine if you have mixed tabs and spaces.
- Avoid lines longer than 120 characters.

#### Whitespace
- If a function literal is anonymous, there should be one space between the word `function` and the `(` (left
parenthesis).
- In function calls, don’t use any space before or after the `(` (left parenthesis).
- Control statements should have one space between the control keyword and opening parenthesis, to distinguish them
from function calls.
- Each `;` (semicolon) in the control part of a for statement should be followed with a space.
- Every `,` (comma) should be followed with whitespace.

#### Variables
- use camel case for variables and methods: `myVariable`, `myMethod`
- use upper camel case (Pascal) for classes / uninstantiated objects: `MyModel`, `MyView`
- If a variable holds a jQuery object, prefix it by a dollar sign `$`. For example:

```javascript
var $ul = $('#myListItem');
```

#### Selectors
- Prefix selectors that deal with JavaScript with `js-`. This way it’s clear the separation between class selectors that
deal with presentation (CSS) and functionality (JavaScript).
- Use the same naming criterion as with CSS selector names, ie, lowercase and consequent words separated by dashes.

#### expr ? yay : nay ternary operator
- use only for simple logic; anything more complex can become difficult to read.

#### Control statements
Control statements such as `if`, `for`, or `switch` should follow these rules:

- The enclosed statements should be indented.
- The `{` (left curly brace) should be at the end of the line that begins the compound statement.
- The `}` (right curly brace) should begin a line and be indented to align with the beginning of the line containing
the matching `{` (left curly brace).
- Braces should be used around all statements, even single statements, when they are part of a control structure,
such as an `if` or `for` statement. This makes it easier to add statements without accidentally introducing bugs.
- Should have one space between the control keyword and opening parenthesis, to distinguish them from function calls.


## Examples

#### `if` statements

```javascript
if (condition) {
  statements
}

if (condition) {
  statements
} else {
  statements
}

if (condition) {
  statements
} else if (condition) {
  statements
} else {
  statements
}
```

### `for` statements

```javascript
for (initialization; condition; update) {
  statements;
}

for (variable in object) {
  if (condition) {
    statements
  }
}
```

### `switch` statements

```javascript
switch (condition) {
  case 1:
    statements
    break;

  case 2:
    statements
    break;

  default:
    statements
}
```

### Functions

```javascript
function myFunction() {
  // stuff!
}

function anotherFunction(firstParam, secondParam, thirdParam) {
  // stuff!
}

var yetAnotherFunction = function(firstParam) {
  // stuff!
}

var anonymousFunction = function () {
  // more stuff!
}
```
