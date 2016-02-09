# MEXCLA

Multi-lingual conferencing system built with node.js and webrtc2sip

## Development Details

### RUN

Lanuch mongod: ``` npm run mongod `` or:

Ensure the database URI is correct in app.js: ``` mongoose.connect('mongodb://host:port/database') ``` and  launch mongodb: ``` mongod [--dbpath path/to/db/folder] [--port portNumber] ```

start app: ``` npm start ``` or ```node app```

Change port in app.js if needed. Currently: 8080.

### Design notes

#### Files and Folders


```
app.js - the server
app.spec.js -- server tests
browser.spec.js -- client & intergration tests using selenium
test/ -- client javascript tests
models/ -  mongoose models
views/ - (NOT currently used) jade templates
src/ - where all front-end code is kept
    src/index.html - index file, also contains underscore templates
    src/js/libs/ - js libraries compiled to public/js/libs
    src/js/app/ - app js files compiled to public/js/main.js
    src/sass/ - scss files compiled to public/css
public/ - gulp-built output
bower.js - front library config file
gulpfile.js - build script
package.js - npm config file
```

src/js/app/*.js - these are the javascript files for the app. They are concatenated into one file -- `main.js` -- during the build process. The order is important (see the gulp task 'js'). Current order and role of each file:

  * masterfile.js - defines globals variables -- `app`, `Views`, `Models` -- as objects
  * translation.js - creates a global object, `websiteText`, which contains all the translatable text for the app
  * models.js - backbone models: `Models.User`, `Models.Room`  * views.js - backbone views
  * router.js - creates `MexclaRouter`
  * app.js -- creates router instance `app.router`.
  * ui.js -- ui code
    
#### misc notes

To build run: `gulp`

Except for the static files in the public folder, app.js only returns json.

The app stores two cookies:

  * 'id' which is the Mongo `_id` of the user
  * 'lang' the user's current language
  
*The app won't work without cookies!*

The app's view changes by replacing or appending to `<div id="content">`

A `user` instance is created and stored at `app.user`, which is referenced by views. If in a room, that `room` is kept at `app.room`. The view's templates are found in index.html. Look for these tags:

```
<script id="view-name" type="text/template">
``` 

