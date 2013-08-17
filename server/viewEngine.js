/*global rendr*/

var path = require('path')
  , _ = require('underscore')
  , layoutTemplate
  , debug = require('debug')('rendr:ViewEngine');

module.exports = exports = ViewEngine;

function ViewEngine(options) {

  debug('ViewEngine constructor, options : %s', options);

  this.options = options || {};

  /**
   * Ensure `render` is bound to this instance, because it can be passed around.
   */
  this.render = this.render.bind(this);
}

ViewEngine.prototype.render = function render(viewPath, data, callback) {

  debug('ViewEngine render, options : %s', viewPath);

  var app, layoutData;

  data.locals = data.locals || {};
  app = data.app;
  layoutData = _.extend({}, data, {
    body: this.getViewHtml(viewPath, data.locals, app),
    appData: app.toJSON(),
    bootstrappedData: this.getBootstrappedData(data.locals, app),
    _app: app
  });
  this.renderWithLayout(layoutData, app, callback);
};

/**
 * Render with a layout.
 */
ViewEngine.prototype.renderWithLayout = function renderWithLayout(locals, app, callback) {
  
  debug('ViewEngine renderWithLayout');
  
  this.getLayoutTemplate(app, function(err, templateFn) {
    if (err) return callback(err);
    var html = templateFn(locals);
    callback(null, html);
  });
};

/**
 * Cache layout template function.
 */
ViewEngine.prototype.getLayoutTemplate = function getLayoutTemplate(app, callback) {
  var layoutPath;

  if (layoutTemplate) {
    return callback(null, layoutTemplate);
  }
  app.templateAdapter.getLayout('__layout', function(err, template) {
    if (err) return callback(err);
    layoutTemplate = template;
    callback(err, layoutTemplate);
  });
};

ViewEngine.prototype.getViewHtml = function getViewHtml(viewPath, locals, app) {
  
  debug('ViewEngine getViewHtml, options : %s', viewPath);

  var BaseView, View, name, view, basePath;

  basePath = path.join('app', 'views');
  BaseView = require('../shared/base/view');
  locals = _.clone(locals);

  // Pass in the app.
  locals.app = app;
  name = viewPath.substr(viewPath.indexOf(basePath) + basePath.length + 1);
  View = BaseView.getView(name);
  view = new View(locals);
  return view.getHtml();
};

ViewEngine.prototype.getBootstrappedData = function getBootstrappedData(locals, app) {
  var modelUtils = require('../shared/modelUtils')
    , bootstrappedData = {};

  _.each(locals, function(modelOrCollection, name) {
    if (modelUtils.isModel(modelOrCollection) || modelUtils.isCollection(modelOrCollection)) {
      bootstrappedData[name] = {
        summary: app.fetcher.summarize(modelOrCollection),
        data: modelOrCollection.toJSON()
      };
    }
  });
  return bootstrappedData;
};
