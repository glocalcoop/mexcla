// npm install --save-dev gulp gulp-plumber gulp-watch gulp-livereload gulp-minify-css gulp-jshint jshint-stylish gulp-uglify gulp-rename gulp-notify gulp-include gulp-sass

var gulp = require('gulp'),
    plumber = require( 'gulp-plumber' ),
    watch = require( 'gulp-watch' ),
    livereload = require( 'gulp-livereload' ),
    minifycss = require( 'gulp-cssnano' ),
    // minifycss = require( 'gulp-minify-css' ),
    // jshint = require( 'gulp-jshint' ),
    // stylish = require( 'jshint-stylish' ),
    uglify = require( 'gulp-uglify' ),
    rename = require( 'gulp-rename' ),
    notify = require( 'gulp-notify' ),
    include = require( 'gulp-include' ),
    sass = require( 'gulp-sass' ),
    concat = require('gulp-concat'),
    inject = require('gulp-inject');

var onError = function( err ) {
    console.log( 'An error occurred:', err.message );
    this.emit( 'end' );
};

var paths = {
  /* Source paths */
  styles: './src/sass/**/*.scss',
  scripts: './src/js/app/',
  images: './src/images/**/*',
  fonts: './src/fonts/*',
  libs: './src/libs/**/*',
  vertoLibs: './src/js/verto/*',
  index: './src/index.html',
  templates: './src/templates/*.html',

  /* Output paths */
  stylesOutput: './public/css',
  scriptsOutput: './public/js',
  imagesOutput: './public/images',
  fontsOutput: './public/fonts',
  indexOutput: './public/',
  libsOutput: './public/libs'
};


gulp.task( 'styles', function() {
    return gulp.src( paths.styles, {
        style: 'expanded'
    } )
    .pipe( plumber( { errorHandler: onError } ) )
    .pipe( sass() )
    .pipe( gulp.dest( paths.stylesOutput ) )
    .pipe( minifycss() )
    .pipe( rename( { suffix: '.min' } ) )
    .pipe( gulp.dest( paths.stylesOutput ) )
    .pipe( notify( { message: 'Styles task complete' } ) );
});

gulp.task('images', function(){
  return gulp.src(paths.images)
    .pipe(gulp.dest(paths.imagesOutput))
    .pipe( notify( { message: 'Images task complete' } ) );
});

gulp.task('fonts', function(){
  return gulp.src(paths.fonts)
    .pipe(gulp.dest(paths.fontsOutput))
    .pipe( notify( { message: 'Fonts task complete' } ) );
});

gulp.task('scripts', function(){
  var basePath = paths.scripts;
  var files = ['masterfile.js', 'config.js', 'translation.js', 'models/*', 'views/*', 'router.js','app.js', 'ui.js'];
  var scripts = files.map(f => basePath + f);
  return gulp.src(scripts)
      .pipe(concat('main.js'))
      .pipe(gulp.dest(paths.scriptsOutput))
      .pipe( notify( { message: 'Script task complete' } ) );
});

gulp.task('libs', function() {
    return gulp.src(paths.libs)
        .pipe(gulp.dest(paths.libsOutput))
        .pipe( notify( { message: 'Libs task complete' } ) );
});

gulp.task('vertoLibs', function(){
  return gulp.src(paths.vertoLibs)
    .pipe(gulp.dest(paths.libsOutput))
    .pipe( notify( { message: 'Verto Libs task complete' } ) );
});

gulp.task('index', function(){
  return gulp.src(paths.index)
    .pipe(inject(gulp.src(paths.templates),{
      starttag: '<!-- inject:templates:{{ext}} -->',
      transform: function(filePath, file) {
        return file.contents.toString('utf8');
      }
    }))  
    .pipe(gulp.dest(paths.indexOutput));
});

gulp.task('test-runner', function(){
  return gulp.src('./test/runner.html')
    .pipe(inject(gulp.src(paths.templates),{
      starttag: '<!-- inject:templates:{{ext}} -->',
      transform: function(filePath, file) {
        return file.contents.toString('utf8');
      }
    }))
    .pipe(concat('index.html'))
    .pipe(gulp.dest('./test/'));
});

gulp.task( 'watch', function() {
    livereload.listen();
    gulp.watch( './src/sass/**/*.scss', [ 'styles' ] );
    gulp.watch( './src/js/**/*.js', [ 'scripts' ] );
    gulp.watch( './src/images/*', [ 'images' ] );
    gulp.watch( './src/fonts/*', [ 'fonts' ] );
    gulp.watch( './src/libs/*.js', [ 'libs' ] );
    gulp.watch( './test/runner.html', [ 'test-runner' ] );
    gulp.watch( paths.index, [ 'index' ] );
} );



gulp.task( 'default', [ 'watch', 'libs', 'vertoLibs', 'scripts', 'index', 'styles', 'images', 'fonts', 'test-runner'], function() {});
