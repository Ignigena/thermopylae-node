/*global app, Backbone, $, _*/
(function () {
  "use strict";

  window.app = {
    Views: {},
    Extensions: {},
    Router: null,

    init: function () {

      this.instance = new app.Views.App();
      Backbone.history.start();

    }
  };

  $(function () {
    window.app.init();
    window.nwDispatcher.requireNwGui();
  });

  app.Router = Backbone.Router.extend({

    routes: {
      'dashboard': 'dashboard',
      'contacts': 'contacts',
      '': 'home'
    },

    home: function () {
      var view = new app.Views.Home();
      app.instance.goto(view);
    },

    dashboard: function () {
      var view = new app.Views.Dashboard();
      app.instance.goto(view);
    },

    contacts: function () {
      var view = new app.Views.Contacts();
      app.instance.goto(view);
    }

  });

  app.Extensions.View = Backbone.View.extend({

    initialize: function () {
      this.router = new app.Router();
    },

    render: function (options) {

      options = options || {};

      if (options.page === true) {
        this.$el.addClass('page');
      }

      return this;

    },

    transitionIn: function (callback) {

      var view = this,
        delay,
        transitionIn = function () {
          view.$el.addClass('is-visible');
          view.$el.one('transitionend', function () {
            if (_.isFunction(callback)) {
              callback();
            }
          });
        };

      _.delay(transitionIn, 20);

    },

    transitionOut: function (callback) {

      var view = this;

      view.$el.removeClass('is-visible');
      view.$el.one('transitionend', function () {
        if (_.isFunction(callback)) {
          callback();
        }
      });

    }

  });

  app.Views.App = app.Extensions.View.extend({

    el: 'body',

    goto: function (view) {

      var previous = this.currentPage || null,
        next = view;

      if (previous) {
        previous.transitionOut(function () {
          previous.remove();
        });
      }

      next.render({ page: true });
      this.$el.append(next.$el);
      next.transitionIn();
      this.currentPage = next;

    }

  });

  app.Views.Home = app.Extensions.View.extend({

    className: 'home',

    events: {
      'keyup :input': 'updateForm'
    },

    domainRegex: new RegExp("^@{0}(http://)?(www\.)?(\d|\w|\.)+\.(com|net|org|info|tv)"),
    serverRegex: new RegExp("^bal|web|ded|srv|fsdb-"),
    searchSubtitle: 'Press enter to search by ',
    searchString: '',
    searchMode: 'docroot',

    updateForm: function (e) {
      if (e.keyCode === 13) {
        this.performSearch();
        return;
      }

      this.searchString = $('#search').val();

      if (!this.searchString) {
        $('.form-control-feedback, .searching-for').hide();
        return;
      }

      $('.form-control-feedback, .searching-for').show();
      $('.searchfield').removeClass('has-success has-error');
      $('.form-control-feedback').removeClass('fa-frown-o fa-smile-o').addClass('fa-level-down');

      if (this.domainRegex.test(this.searchString)) {
        $('.searching-for').text(this.searchSubtitle + 'domain name.');
        this.searchMode = 'domain';
      } else if (this.serverRegex.test(this.searchString)) {
        $('.searching-for').text(this.searchSubtitle + 'server name.');
        this.searchMode = 'server';
      } else {
        $('.searching-for').text(this.searchSubtitle + 'customer docroot.');
        this.searchMode = 'docroot';
      }
    },
    performSearch: function () {
      $('.form-control-feedback').removeClass('fa-level-down').addClass('fa-circle-o-notch fa-spin');
      $.get('/find?' + this.searchMode + '=' + this.searchString, this.validateSearch);
    },
    validateSearch: function (data) {
      if (!data) {
        $('.searchfield').removeClass('has-success').addClass('has-error');
        $('.searching-for').removeClass('text-muted').addClass('text-warning').text('Sorry! Unable to locate a hosted customer.');
        $('.form-control-feedback').removeClass('fa-circle-o-notch fa-spin').addClass('fa-frown-o');
      } else {
        $('.searchfield').removeClass('has-error').addClass('has-success');
        $('.form-control-feedback').removeClass('fa-circle-o-notch fa-spin').addClass('fa-smile-o');
        
        app.instance.currentPage.goToDashboard(data);
      }
    },
    goToDashboard: function (data) {
      var view = new app.Views.Dashboard();

      if (app.instance.currentPage.searchMode === 'docroot') {
        app.instance.customerDocroot = app.instance.currentPage.searchString;
      } else if (app.instance.currentPage.searchMode === 'domain') {
        data = data.split('\n')[1].split('.')[0].trim();
        app.instance.customerDocroot = data;
      } else if (app.instance.currentPage.searchMode === 'server') {
        // @todo: Display dropdown of docroots.
        $('.searching-for').removeClass('text-muted').addClass('text-warning').text('Feature not implemented. Sorry!');
        return;
      }

      app.instance.goto(view);
    },

    render: function () {
      var template = _.template($('script[name=home]').html());
      this.$el.html(template());
      return app.Extensions.View.prototype.render.apply(this, arguments);
    }

  });

  app.Views.Dashboard = app.Extensions.View.extend({

    className: 'dashboard',

    render: function () {
      var template = _.template($('script[name=dashboard]').html());
      this.$el.html(template());
      return app.Extensions.View.prototype.render.apply(this, arguments);
    }

  });

  app.Views.Contacts = app.Extensions.View.extend({

    className: 'contacts',

    contactRow: function(user, badge) {
      var row = '<tr><td>' + user.name;

      if (badge) row = row.concat(' <span class="badge">' + badge + '</span>');

      row = row.concat('</td><td>' + user.email + '</td><td>' + user.phone + '</td><td class="text-right">');
      row = row.concat('<a onclick="javascript:window.nwDispatcher.nwGui.Shell.openExternal(\'https://insight.acquia.com/support/tickets/new?user=' + user.username + '\')" type="button" class="btn btn-sm btn-success">File Ticket</a>');
      row = row.concat('</td></tr>');
      
      $('div.panel table.contacts tbody').append(row);
    },

    initialize: function() {
      this.render().afterRender();
    },

    render: function () {
      var template = _.template($('script[name=contacts]').html());
      this.$el.html(template());
      return app.Extensions.View.prototype.render.apply(this, arguments);
    },

    afterRender: function () {
      $.get('/contacts?docroot=' + app.instance.customerDocroot, function (data) {
        data = $.parseJSON(data);

        if (data.Contacts) {
          data.Contacts.forEach(function (contact) {
            app.instance.currentPage.contactRow(contact);
          });
        } else {
          if (data.Primary) {
            data.Primary.forEach(function (contact) {
              app.instance.currentPage.contactRow(contact, 'P');
            });
          }
          if (data.Technical) {
            data.Technical.forEach(function (contact) {
              app.instance.currentPage.contactRow(contact, 'T');
            });
          }
          if (data.Billing) {
            data.Billing.forEach(function (contact) {
              app.instance.currentPage.contactRow(contact, 'B');
            });
          }
        }

        $('div.loading').fadeOut();
        $('div.panel.loaded').fadeIn();
      });
    }

  });

}());
