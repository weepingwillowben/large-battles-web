browserify modules/main.js > static_files/bundle.js
uglifyjs -m < static_files/bundle.js > static_files/bundle.min.js
