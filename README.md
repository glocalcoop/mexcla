# MEXCLA

Multi-lingual conferencing system built with node.js and webrtc2sip

## Development Details

### RUN

Ensure the database URI is correct in app.js: mongoose.connect('mongodb://host:port/database')

launch mongodb: mongod [--dbpath path/to/db/folder] [--port portNumber]

start app: node app

Change port in app.js if needed. Currently: 8080.

### Design notes

#### Files and Folders


```
app.js - the server
app.spec.js -- server tests
models/ -  mongoose models
views/ - (NOT currently used) jade templates
src/ - where all front-end code is kept
public/ - gulp-built output
gulpfile.js - build script
src/index.html - index file, also contains underscore templates
src/js/libs/ - js libraries
src/js/app/ - app ks files
```

src/js/app/*.js - these are the javascript files for the app. They are concatenated into one file -- `main.js` -- during the build process. The order is important (see the gulp task 'js'). Current order and role of each file:

  * masterfile.js - defines globals variables -- `app`, `Views`, `Models` -- as objects
  * translation.js - creates a global object, `websiteText`, which contains all the translatable text for the app
  * models.js - backbone models: `Models.User`, `Models.Room`  * views.js - backbone views
  * router.js - creates `MexclaRouter`
  * app.js -- creates router instance `app.router`.
    
#### misc notes

To build run: `gulp`

Except for the static files in the public folder, app.js only returns json.

The app stores two cookies:
  * 'id' which is the mongo `_id` of the user
  * 'lang' the user's current language
  
*The app won't work without cookies!*

The app's view changes by replacing or appending to `<div id="content">`

A `user` instance is created and stored at `app.user`, which is referenced by views. If in a room, that `room` is kept at `app.room`. The view's templates are found in index.html. Look for these tags:

```html
<script id="view-name" type="text/template">
``` 

