// Licensed under the Apache License, Version 2.0 (the "License"); you may not
// use this file except in compliance with the License. You may obtain a copy of
// the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
// WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
// License for the specific language governing permissions and limitations under
// the License.

define([
  "app",
  "api",
  "addons/fauxton/components",
  "addons/documents/resources",
  "addons/databases/resources",

  // Views
  "addons/documents/views-sidebar",
  "addons/documents/views-queryoptions",

  // Libs
  "addons/fauxton/resizeColumns",

  //plugins
  "plugins/prettify"
],

function(app, FauxtonAPI, Components, Documents, Databases, Views, QueryOptions) {

  function showError (msg) {
    FauxtonAPI.addNotification({
      msg: msg,
      type: 'error',
      clear:  true
    });
  }

  Views.RightAllDocsHeader = FauxtonAPI.View.extend({
    className: "header-right",
    template: "addons/documents/templates/header_alldocs",
    events: {
      'click .toggle-select-menu': 'selectAllMenu'
    },

    initialize: function(options) {
      this.database = options.database;
      this.params = options.params;

      _.bindAll(this);
      this.selectVisible = false;
      FauxtonAPI.Events.on('success:bulkDelete', this.selectAllMenu);

      // insert the Search Docs field
      this.headerSearch = this.insertView("#header-search", new Views.JumpToDoc({
        database: this.database,
        collection: this.database.allDocs
      }));

      // add the Query Options modal + header link
      this.queryOptions = this.insertView("#query-options", new QueryOptions.QueryOptionsTray({
        hasReduce: false,
        showStale: false
      }));
    },

    afterRender: function() {
      this.toggleQueryOptionsHeader(this.isHidden);
    },

    cleanup: function() {
      FauxtonAPI.Events.unbind('success:bulkDelete');
    },

    selectAllMenu: function(e) {
      FauxtonAPI.triggerRouteEvent("toggleSelectHeader");
      FauxtonAPI.Events.trigger("documents:showSelectAll",this.selectVisible);
    },

    // updates the API bar when the route changes
    updateApiUrl: function(api) {
      this.apiBar && this.apiBar.update(api);
    },

    // these are similar, but different! resetQueryOptions() completely resets the settings then overlays the new ones;
    // updateQueryOptions() just updates the existing settings with whatever is specified. Between them, the
    resetQueryOptions: function(options) {
      this.queryOptions.resetQueryOptions(options);
    },

    updateQueryOptions: function(options) {
      this.queryOptions.updateQueryOptions(options);
    },

    hideQueryOptions: function() {
      this.isHidden = true;
      if (this.hasRendered) {
        this.toggleQueryOptionsHeader(this.isHidden);
      }
    },

    showQueryOptions: function() {
      this.isHidden = false;
      if (this.hasRendered) {
        this.toggleQueryOptionsHeader(this.isHidden);
      }
    },

    toggleQueryOptionsHeader: function(hide) {
      $("#header-query-options").toggleClass("hide", hide);
    },

    serialize: function() {
      return {
        database: this.database.get('id')
      };
    }
  });


  Views.DeleteDBModal = Components.ModalView.extend({
    template: "addons/documents/templates/delete_database_modal",
    initialize: function (options) {
      this.database = options.database;
      FauxtonAPI.Events.on('database:delete', this.showDeleteDatabase, this);
    },

    showDeleteDatabase: function () {
      this.showModal();
    },

    cleanup: function() {
      FauxtonAPI.Events.off('database:delete', this.showDeleteDatabase);
    },

    events: {
      "click #delete-db-btn": "deleteDatabase",
      "submit #delete-db-check": "deleteDatabase"
    },

    deleteDatabase: function (event) {
      event.preventDefault();

      var enteredName = $('#db_name').val();
      if (this.database.id != enteredName) {
        this.set_error_msg(enteredName + " does not match database id - are you sure you want to delete " + this.database.id + "?");
        return;
      }

      this.hideModal();
      var databaseName = this.database.id;
      FauxtonAPI.addNotification({
        msg: "Deleting your database...",
        type: "error",
        clear: true
      });

      this.database.destroy().then(function () {
        FauxtonAPI.navigate('#/_all_dbs');
        FauxtonAPI.addNotification({
          msg: 'The database <code>' + _.escape(databaseName) + '</code> has been deleted.',
          clear: true,
          escape: false // beware of possible XSS when the message changes
        });
      }).fail(function (rsp, error, msg) {
        FauxtonAPI.addNotification({
          msg: 'Could not delete the database, reason ' + msg + '.',
          type: 'error',
          clear: true
        });
      });
    }
  });

  Views.Document = FauxtonAPI.View.extend({
    template: "addons/documents/templates/all_docs_item",
    tagName: "tr",
    className: "all-docs-item",

    initialize: function (options) {
      this.checked = options.checked;
    },

    events: {
      "click button.delete": "destroy",
      "dblclick pre.prettyprint": "edit"
    },

    attributes: function() {
      return {
        "data-id": this.model.id
      };
    },

    serialize: function() {
      return {
        doc: this.model,
        checked: this.checked
      };
    },

    establish: function() {
      return [this.model.fetch()];
    },

    edit: function(event) {
      event.preventDefault();
      FauxtonAPI.navigate("#" + this.model.url('web-index'));
    },

    destroy: function(event) {
      event.preventDefault();
      var that = this;

      if (!window.confirm("Are you sure you want to delete this doc?")) {
        return false;
      }

      this.model.destroy().then(function(resp) {
        FauxtonAPI.addNotification({
          msg: "Successfully deleted your doc",
          clear:  true
        });
        that.$el.fadeOut(function () {
          that.remove();
        });

        that.model.collection.remove(that.model.id);
        if (!!that.model.id.match('_design')) {
          FauxtonAPI.triggerRouteEvent('reloadDesignDocs');
        }
      }, function(resp) {
        FauxtonAPI.addNotification({
          msg: "Failed to deleted your doc!",
          type: "error",
          clear:  true
        });
      });
    }
  });

  Views.Row = FauxtonAPI.View.extend({
    template: "addons/documents/templates/index_row_docular",
    tagName: "tr",

    events: {
      "click button.delete": "destroy"
    },

    destroy: function (event) {
      event.preventDefault();
      window.alert('Cannot delete a document generated from a view.');
    },

    serialize: function() {
      return {
        doc: this.model,
        url: this.model.url('app')
      };
    }
  });


  Views.AllDocsNumber = FauxtonAPI.View.extend({
    template: "addons/documents/templates/all_docs_number",

    initialize: function (options) {
      this.newView = options.newView || false;
      this.pagination = options.pagination;
      _.bindAll(this);

      this._perPage = options.perPageDefault || 20;
      this.listenTo(this.collection, 'totalRows:decrement', this.render);
    },

    events: {
      'change #select-per-page': 'updatePerPage'
    },

    updatePerPage: function (event) {
      this._perPage = parseInt(this.$('#select-per-page :selected').val(), 10);
      this.pagination.updatePerPage(this.perPage());
      FauxtonAPI.triggerRouteEvent('perPageChange', this.pagination.documentsLeftToFetch());
    },

    afterRender: function () {
      this.$('option[value="' + this.perPage() + '"]').attr('selected', "selected");
    },

    serialize: function () {
       var totalRows = 0,
          updateSeq = false,
          pageStart = 0,
          pageEnd = 20;

      if (!this.newView) {
        totalRows = this.collection.length;
        updateSeq = this.collection.updateSeq();
      }

      if (this.pagination) {
        pageStart = this.pagination.pageStart();
        pageEnd =  this.pagination.pageEnd();
      }

      return {
        database: app.utils.safeURLName(this.collection.database.id),
        updateSeq: updateSeq,
        totalRows: totalRows,
        pageStart: pageStart,
        pageEnd: pageEnd
      };
    },

    perPage: function () {
      return this._perPage;
    },

    setCollection: function (collection) {
      this.collection = collection;
    }
  });


  // TODO: Rename to reflect that this is a list of rows or documents
  Views.AllDocsList = FauxtonAPI.View.extend({
    template: "addons/documents/templates/all_docs_list",
    events: {
      "click button.all": "selectAll",
      "click button.js-bulk-delete": "bulkDelete",
      "click #collapse": "collapse",
      "click .all-docs-item": "toggleDocument",
      "click #js-end-results": "openQueryOptionsTray"
    },

    initialize: function (options) {
      this.nestedView = options.nestedView || Views.Document;
      this.rows = {};
      this.viewList = !!options.viewList;

      if (options.ddocInfo) {
        this.designDocs = options.ddocInfo.designDocs;
        this.ddocID = options.ddocInfo.id;
      }
      this.newView = options.newView || false;
      this.docParams = options.docParams || {};
      this.params = options.params || {};
      this.expandDocs = true;
      this.perPageDefault = this.docParams.limit || 20;

      // some doclists don't have an option to delete
      if (!this.viewList) {
        this.bulkDeleteDocsCollection = options.bulkDeleteDocsCollection;
      }
    },

    removeDocuments: function (ids) {
      _.each(ids, function (id) {
        this.removeDocument(id);
      }, this);

      this.pagination.updatePerPage(parseInt(this.$('#select-per-page :selected').val(), 10));
      FauxtonAPI.triggerRouteEvent('perPageChange', this.pagination.documentsLeftToFetch());
    },

    removeDocument: function (id) {
      var that = this;

      if (!this.rows[id]) {
        return;
      }

      this.rows[id].$el.fadeOut('slow', function () {
        that.rows[id].remove();
      });
    },

    showError: function (ids) {
      if (ids) {
        showError('Failed to delete: ' + ids.join(', '));
        return;
      }

      showError('Failed to delete your doc!');
    },

    toggleDocument: function (event) {
      var $row = this.$(event.target).closest('tr'),
          docId = $row.attr('data-id'),
          rev = this.collection.get(docId).get('_rev'),
          data = {_id: docId, _rev: rev, _deleted: true};

      if (!$row.hasClass('js-to-delete')) {
        this.bulkDeleteDocsCollection.add(data);
      } else {
        this.bulkDeleteDocsCollection.remove(this.bulkDeleteDocsCollection.get(docId));
      }

      $row.find('.js-row-select').prop('checked', !$row.hasClass('js-to-delete'));
      $row.toggleClass('js-to-delete');

      this.toggleTrash();
    },

    toggleTrash: function () {
      var $bulkdDeleteButton = this.$('.js-bulk-delete');

      if (this.bulkDeleteDocsCollection && this.bulkDeleteDocsCollection.length > 0) {
        $bulkdDeleteButton.removeClass('disabled');
      } else {
        $bulkdDeleteButton.addClass('disabled');
      }
    },

    openQueryOptionsTray: function(e) {
      e.preventDefault();
      FauxtonAPI.Events.trigger("QueryOptions:openTray");
    },

    establish: function() {
      if (this.newView) { return null; }

      return this.collection.fetch({
        reset: true,
        success:  function() { },
        error: function(model, xhr, options){
          // TODO: handle error requests that slip through
          // This should just throw a notification, not break the page
          FauxtonAPI.addNotification({
            msg: "Bad Request",
            type: "error",
            clear:  true
          });

          //now redirect back to alldocs
          FauxtonAPI.navigate(model.database.url("index") + "?limit=100");
        }
      });
    },

    selectAll: function (evt) {
      var $allDocs = this.$('.all-docs'),
          $rows = $allDocs.find('tr'),
          $checkboxes = $allDocs.find('input:checkbox'),
          modelsAffected,
          docs;

      $checkboxes.prop('checked', !$(evt.target).hasClass('active')).trigger('change');

      if ($(evt.target).hasClass('active')) {
        modelsAffected = _.reduce($rows, function (acc, el) {
          var docId = $(el).attr('data-id');
          acc.push(docId);
          return acc;
        }, []);
        this.bulkDeleteDocsCollection.remove(modelsAffected);
      } else {
        modelsAffected = _.reduce($rows, function (acc, el) {
          var docId = $(el).attr('data-id'),
              rev = this.collection.get(docId).get('_rev');

          acc.push({_id: docId, _rev: rev, _deleted: true});
          return acc;
        }, [], this);
        this.bulkDeleteDocsCollection.add(modelsAffected);
      }

      this.toggleTrash();
    },

    serialize: function() {
      return {
        viewList: this.viewList,
        resizeLayout: "", //this.viewList ? "-half":"",
        expandDocs: this.expandDocs,
        endOfResults: !this.pagination.canShowNextfn()
      };
    },

    collapse: function (event) {
      event.preventDefault();

      if (this.expandDocs) {
        this.expandDocs = false;
      } else {
        this.expandDocs = true;
      }

      this.render();
    },

    bulkDelete: function() {
      var that = this,
          documentsLength = this.bulkDeleteDocsCollection.length,
          msg;

      msg = "Are you sure you want to delete these " + documentsLength + " docs?";
      if (documentsLength === 0 || !window.confirm(msg)) {
        return false;
      }

      this.bulkDeleteDocsCollection.bulkDelete();
    },

    addPagination: function () {
      this.pagination = new Components.IndexPagination({
        collection: this.collection,
        scrollToSelector: '#dashboard-content',
        docLimit: this.params.limit,
        perPage: this.perPageDefault
      });
    },

    cleanup: function () {
      this.pagination && this.pagination.remove();
      this.allDocsNumber && this.allDocsNumber.remove();
      _.each(this.rows, function (row) {row.remove();});
    },

    removeNestedViews: function () {
      _.each(this.rows, function (row) {
        row.remove();
      });
      this.rows = {};
    },

    beforeRender: function() {
      var docs;

      if (!this.pagination) {
        this.addPagination();
      }

      this.insertView('#documents-pagination', this.pagination);

      if (!this.allDocsNumber) {
        this.allDocsNumber = new Views.AllDocsNumber({
          collection: this.collection,
          newView: this.newView,
          pagination: this.pagination,
          perPageDefault: this.perPageDefault
        });
      }

      this.setView('#item-numbers', this.allDocsNumber);
      this.removeNestedViews();

      docs = this.expandDocs ? this.collection : this.collection.simple();

      docs.each(function(doc) {
        var isChecked;
        if (this.bulkDeleteDocsCollection) {
          isChecked = this.bulkDeleteDocsCollection.get(doc.id);
        }

        // the location of the ID attribute varies depending on the model. Also, for reduced view searches, the ID isn't
        // available so we use Backbone's own unique ID
        var id = _.has(doc, 'id') ? doc.id : doc.get('id');
        if (_.isUndefined(id)) {
          id = doc.cid;
        }

        this.rows[id] = this.insertView("table.all-docs tbody", new this.nestedView({
          model: doc,
          checked: isChecked
        }));
      }, this);
    },

    setCollection: function (collection) {
      this.collection = collection;
      if (!this.pagination) {
        this.addPagination();
      }
      this.pagination.setCollection(collection);
      this.allDocsNumber.setCollection(collection);
    },

    setParams: function (docParams, urlParams) {
      this.docParams = docParams;
      this.params = urlParams;
      this.perPageDefault = this.docParams.limit;

      if (this.params.limit) {
        this.pagination.docLimit = this.params.limit;
      }
    },

    afterRender: function () {
      $("#dashboard-content").scrollTop(0);

      prettyPrint();

      if (this.bulkDeleteDocsCollection) {
        this.stopListening(this.bulkDeleteDocsCollection);
        this.listenTo(this.bulkDeleteDocsCollection, 'error', this.showError);
        this.listenTo(this.bulkDeleteDocsCollection, 'removed', this.removeDocuments);
        this.listenTo(this.bulkDeleteDocsCollection, 'updated', this.toggleTrash);
      }

      this.toggleTrash();
    },

    perPage: function () {
      return this.allDocsNumber.perPage();
    }
  });



  Views.JumpToDoc = FauxtonAPI.View.extend({
    template: "addons/documents/templates/jumpdoc",

    initialize: function (options) {
      this.database = options.database;
    },

    events: {
      "submit #jump-to-doc": "jumpToDoc"
    },

    jumpToDoc: function (event) {
      event.preventDefault();
      var docId = this.$('#jump-to-doc-id').val().trim();
      FauxtonAPI.navigate('/database/' + app.utils.safeURLName(this.database.id) +'/' + app.utils.safeURLName(docId), {trigger: true});
    },

    afterRender: function () {
     this.typeAhead = new Components.DocSearchTypeahead({el: '#jump-to-doc-id', database: this.database});
     this.typeAhead.render();
    }
  });



  Views.DdocInfo = FauxtonAPI.View.extend({
    template: "addons/documents/templates/ddoc_info",

    initialize: function (options) {
      this.ddocName = options.ddocName;
      this.refreshTime = options.refreshTime || 5000;
      this.listenTo(this.model, 'change', this.render);
    },

    establish: function () {
      return this.model.fetch();
    },

    afterRender: function(){
      this.startRefreshInterval();
    },

    serialize: function () {
      return {
        Ddoc: this.ddocName,
        view_index: this.model.get('view_index')
      };
    },

    startRefreshInterval: function () {
      var model = this.model;

      // Interval already set
      if (this.intervalId) { this.stopRefreshInterval(); }

      this.intervalId = setInterval(function () {
        model.fetch();
      }, this.refreshTime);
    },

    stopRefreshInterval: function () {
      clearInterval(this.intervalId);
    },

    cleanup: function () {
      this.stopRefreshInterval();
    }
  });

  Documents.Views = Views;

  return Documents;
});
