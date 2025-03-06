const express = require('express');
const proxy = require('express-http-proxy');
const webpackDevMiddleware = require('webpack-dev-middleware');
const webpack = require('webpack');

require('dotenv').config();

const compiler = webpack(require('../webpack.config.js'));
const handler = require('./handler');
const log = require('./log');
const routes = require('../src/routes.json').concat(require('../src/routes-dev.json'))
    .filter(route => !process.env.VIEW || process.env.VIEW === route.view);

// Create server
const app = express();
app.disable('x-powered-by');

// Server setup
app.use(log());

app.get('/session', (req, res) => {
    res.status(200).json({
        flags: {
            project_comments_enabled: true,
            gallery_comments_enabled: true,
            userprofile_comments_enabled: true,
            everything_is_totally_normal: false
        }
    });
});

// Bind routes
routes.forEach(route => {
    app.get(route.pattern, handler(route));
});

const middlewareOptions = {};

app.use(webpackDevMiddleware(compiler, middlewareOptions));

const proxyHost = process.env.FALLBACK || '';
if (proxyHost !== '') {
    // Fall back to scratchr2 in development
    // This proxy middleware must come last
    app.use('/', proxy(proxyHost));
}

// Start listening
const port = process.env.PORT || 8333;
app.listen(port, () => {
    process.stdout.write(`Server listening on port ${port}\n`);
    if (proxyHost) {
        process.stdout.write(`Proxy host: ${proxyHost}\n`);
    }
});
