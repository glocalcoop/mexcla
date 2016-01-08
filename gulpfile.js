// npm install --save-dev gulp gulp-plumber gulp-watch gulp-livereload gulp-minify-css gulp-jshint jshint-stylish gulp-uglify gulp-rename gulp-notify gulp-include gulp-sass

var gulp = require('gulp'),
    plumber = require( 'gulp-plumber' ),
    watch = require( 'gulp-watch' ),
    livereload = require( 'gulp-livereload' ),
    minifycss = require( 'gulp-minify-css' ),
    // jshint = require( 'gulp-jshint' ),
    // stylish = require( 'jshint-stylish' ),
    uglify = require( 'gulp-uglify' ),
    rename = require( 'gulp-rename' ),
    notify = require( 'gulp-notify' ),
    include = require( 'gulp-include' ),
    sass = require( 'gulp-sass' ),
    concat = require('gulp-concat');

var onError = function( err ) {
    console.log( 'An error occurred:', err.message );
    this.emit( 'end' );
};

var paths = {
    /* Source paths */
    styles: ['./src/sass/*'],
    scripts: [
        './public/src/js/*'
    ],
    images: ['./src/images/**/*'],
    fonts: [
        './src/fonts/*'
    ],

    /* Output paths */
    stylesOutput: './public/css',
    scriptsOutput: './public/js',
    imagesOutput: './public/images',
    fontsOutput: './public/fonts'
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
    .pipe( gulp.dest( paths.stylesOutput ) );
});

gulp.task('libs', function() {
    return gulp.src( './src/js/libs/*')
        .pipe(gulp.dest('./public/js/libs'));
});

gulp.task('images', function(){
  return gulp.src(paths.images)
    .pipe(gulp.dest(paths.imagesOutput));
});

gulp.task('fonts', function(){
  return gulp.src(paths.fonts)
    .pipe(gulp.dest(paths.fontsOutput));
});

gulp.task('js', function(){
  var basePath = 'src/js/app/';
  var files = ['masterfile.js', 'translation.js', 'models.js', 'views.js', 'router.js','app.js'];
  var scripts = files.map(f => basePath + f);
  return gulp.src(scripts)
      .pipe(concat('main.js'))
      .pipe(gulp.dest('./public/js'));
});

gulp.task('index', function(){
  return gulp.src('src/index.html')
    .pipe(gulp.dest('./public'));
});

gulp.task( 'watch', function() {
    livereload.listen();
    gulp.watch( './public/src/sass/**/*.scss', [ 'styles' ] );
    //gulp.watch( './src/js/**/*.js', [ 'scripts' ] );
    gulp.watch( './**/*.php' ).on( 'change', function( file ) {
        livereload.changed( file );
    } );
} );

gulp.task( 'default', [ 'libs', 'js', 'index', 'styles', 'images', 'fonts'], function() {});
