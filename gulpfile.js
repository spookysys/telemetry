// Ref. https://www.sitepoint.com/introduction-gulp-js/
// Ref. http://brianflove.com/2016/11/08/typescript-2-express-node/

var
	// modules
	gulp = require('gulp'),
	gutil = require('gulp-util'),
	newer = require('gulp-newer'),
	run = require('gulp-run'),
	//prune = require('gulp-prune'),
	imagemin = require('gulp-imagemin'),
	htmlclean = require('gulp-htmlclean'),
	//	concat = require('gulp-concat'),
	//	deporder = require('gulp-deporder'),
	//	stripdebug = require('gulp-strip-debug'),
	uglify = require('gulp-uglify'),
	sass = require('gulp-sass'),
	postcss = require('gulp-postcss'),
	assets = require('postcss-assets'),
	autoprefixer = require('autoprefixer'),
	mqpacker = require('css-mqpacker'),
	cssnano = require('cssnano'),
	//nodemon = require('gulp-nodemon'),
	sourcemaps = require('gulp-sourcemaps'),
	//FileCache = require('gulp-file-cache'),
	ts = require('gulp-typescript'),
	replace = require('gulp-replace'),
	del = require('del'),

	// development mode?
	devBuild = (process.env.NODE_ENV !== 'production'),

	// folders
	folder = {
		src: 'src/',
		build: 'build/'
	},

	// settings
	config = {
		project_id: 'telemetry-app-156617',
		app_id: 'telemetry-app',
		version: 'dev'
	}


// CSS processing
gulp.task('css', function () {
	var out = folder.build;
	return gulp.src(folder.src + '**/*.scss')
		.pipe(sass({
			outputStyle: 'nested',
			//imagePath: 'images/',
			precision: 3,
			errLogToConsole: true
		}))
		.pipe(postcss([
			//assets({ loadPaths: ['images/'] }),
			autoprefixer({ browsers: ['last 2 versions', '> 2%'] }),
			mqpacker,
			cssnano
		]))
		.pipe(gulp.dest(out));
});

// TypeScript processing
var tsProject = ts.createProject("tsconfig.json");
gulp.task('ts', function () {
	var out = folder.build;
	var stream = gulp.src(folder.src + '**/*.ts')
		.pipe(newer(out))
		.pipe(sourcemaps.init())
		.pipe(tsProject())
		.pipe(sourcemaps.write({
			sourceRoot: '../' + folder.src
		}))
		.pipe(gulp.dest(out));
	return stream;
});


gulp.task('clean', function () {
	return del(folder.build);
});

gulp.task('build', ['ts']);


// Build docker locally and deploy
// (Standard is to build remotely, but this way is more transparent)
gulp.task('deploy', ['build'], function () {
	var image_url = 'gcr.io/' + config.project_id + '/' + config.app_id;
	return run(
		'docker build -t ' + image_url + ' . && ' +
		'gcloud docker -- push ' + image_url + ' && ' +
		'gcloud app --project=' + config.project_id + ' --verbosity=info deploy --image-url=' + image_url + ' --version=' + config.version,
		{ verbosity: 3 }
	).exec().pipe(gulp.dest('output'))
});

gulp.task('stop', function () {
	return run(
		'gcloud app --project=' + config.project_id + ' versions stop ' + config.version
	).exec().pipe(gulp.dest('output'))
});


gulp.task('default', ['build']);