/* eslint-env node */
const gulp     = require('gulp')
const iconfont = require('gulp-iconfont')
const fs = require("fs");

let tasks = {

    icons(cb) {
        let fs  = require('fs')
        let css = `@font-face {
    font-family: "yuneta-icons-font";
    src: url("yuneta-icons-font.ttf") format("truetype");    
    font-weight: normal;
    font-style: normal;
}
[class^="yuneta-icon-"]:before,
[class*=" yuneta-icon-"]:before {
    font-family: "yuneta-icons-font";
    display: inline-block;
    vertical-align: middle;
    line-height: 1;
    font-weight: normal;
    font-style: normal;
    speak: none;
    text-decoration: inherit;
    text-transform: none;
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
}
`
        let html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <link href="./dist/yuneta-icons-font.css" rel="stylesheet">
    <title>yuneta-icons-font</title>
    <style>
        body { font-family: verdana; font-size: 13px }
        .preview { padding: 8px; margin: 4px; width: 200px; box-shadow: 1px 1px 2px #ccc; float: left }
        .preview:hover { background-color: #f5f5f5 }
        .preview span.icon { font-size: 16px; padding: 8px }
    </style>
</head>
<body>
    <h1 style="font-family: arial; padding-left: 15px;">yuneta-icons-font $count</h1>
`
        let json = []
        gulp.src(['./icons/*.svg'])
            .pipe(iconfont({
                fontName: 'yuneta-icons-font',
                formats: ['ttf', 'eot', 'woff'],
                fontHeight: 1500,
                normalize: true,
                preserveAspectRatio: true,
                prependUnicode: true, // recommended option
                fixedWidth: true,
                centerHorizontally: true,
                centerVertically: true,
                timestamp: Math.round(Date.now()/1000)
            }))
            .on('error', function (err) {
                this.emit('end')
            })
            .on('glyphs', function(glyphs, options) {
                glyphs = glyphs.sort((a, b) => (a.name > b.name) - (a.name < b.name)) // need reorder f series
                glyphs.forEach(function(glyph, i) {
                    let unicode = glyph.unicode[0].charCodeAt(0);
                    html       += `    <div class="preview"><span class="icon yuneta-icon-${glyphs[i].name}"></span><span>yuneta-icon-${glyphs[i].name}</span></div>\n`
                    css        += `.yuneta-icon-${glyphs[i].name}:before { content: "\\${unicode.toString(16)}" }\n`
                    json.push(glyphs[i].name)
                })

                html += '    <div style="clear: both; height: 10px;"></div>\n</body>\n</html>'
                html  = html.replace('$count', ' - ' + glyphs.length + ' glyphs')
                fs.writeFileSync('./dist/yuneta-icons-font.css', css)
                fs.writeFileSync('./preview.html', html)
                fs.writeFileSync('./glyphs.json', JSON.stringify(json))
            })
            .pipe(gulp.dest('./dist/'))
            .on('end', function () {
                let font = fs.readFileSync('./dist/yuneta-icons-font.ttf')
                let file = fs.readFileSync('./dist/yuneta-icons-font.css', 'utf-8')
                file     = file.replace('src: url("yuneta-icons-font.ttf") format("truetype");',
                    `src: url("data:application/x-font-ttf;charset=utf-8;base64,${font.toString('base64')}") format("truetype");`)
                fs.writeFileSync('./dist/yuneta-icons-font.css', file)
                cb()
            })
    },

    watch(cb) {
        gulp.watch(['icons/*.svg'], tasks.icons)
    },
}

exports.default = gulp.series(tasks.icons)
exports.icons   = gulp.series(tasks.icons)
