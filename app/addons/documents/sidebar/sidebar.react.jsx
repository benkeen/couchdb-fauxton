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
  'app',
  'api',
  'react',
  'react-dom',
  'addons/documents/sidebar/stores.react',
  'addons/documents/sidebar/actions',
  'addons/components/react-components.react',
  'addons/documents/index-editor/actions',
  'addons/fauxton/components.react',
  'addons/documents/views',
  'addons/documents/helpers',
  'libs/react-bootstrap',
  'plugins/prettify'
],

function (app, FauxtonAPI, React, ReactDOM, Stores, Actions, Components, IndexEditorActions, GeneralComponents, DocumentViews,
    DocumentHelper, ReactBootstrap) {

  var DeleteDBModal = DocumentViews.Views.DeleteDBModal;
  var store = Stores.sidebarStore;
  var LoadLines = Components.LoadLines;
  var OverlayTrigger = ReactBootstrap.OverlayTrigger;
  var Popover = ReactBootstrap.Popover;
  var Modal = ReactBootstrap.Modal;
  var ConfirmationModal = GeneralComponents.ConfirmationModal;


  var MainSidebar = React.createClass({
    propTypes: {
      selectedNavItem: React.PropTypes.string.isRequired
    },

    getNewButtonLinks: function () {  // these are links for the sidebar '+' on All Docs and All Design Docs
      return DocumentHelper.getNewButtonLinks(this.props.databaseName);
    },

    buildDocLinks: function () {
      var base = FauxtonAPI.urls('base', 'app', this.props.databaseName);
      return FauxtonAPI.getExtensions('docLinks').map(function (link) {
        return (
          <li key={link.url} className={this.getNavItemClass(link.url)}>
            <a id={link.url} href={base + link.url}>{link.title}</a>
          </li>
        );
      }, this);
    },

    getNavItemClass: function (navItem) {
      return (navItem === this.props.selectedNavItem) ? 'active' : '';
    },

    render: function () {
      var docLinks = this.buildDocLinks();
      var changesUrl     = '#' + FauxtonAPI.urls('changes', 'app', this.props.databaseName, '');
      var permissionsUrl = '#' + FauxtonAPI.urls('permissions', 'app', this.props.databaseName);
      var databaseUrl    = FauxtonAPI.urls('allDocs', 'app', this.props.databaseName, '');
      var mangoQueryUrl  = FauxtonAPI.urls('mango', 'query-app', this.props.databaseName);
      var runQueryWithMangoText = app.i18n.en_US['run-query-with-mango'];
      var buttonLinks = this.getNewButtonLinks();

      return (
        <ul className="nav nav-list">
          <li className={this.getNavItemClass('all-docs')}>
            <a id="all-docs"
              href={"#/" + databaseUrl}
              className="toggle-view">
              All Documents
            </a>
            <div id="new-all-docs-button" className="add-dropdown">
              <Components.MenuDropDown links={buttonLinks} />
            </div>
          </li>
          <li className={this.getNavItemClass('mango-query')}>
            <a
              id="mango-query"
              href={'#' + mangoQueryUrl}
              className="toggle-view">
              {runQueryWithMangoText}
            </a>
          </li>
          <li className={this.getNavItemClass('permissions')}>
            <a id="permissions" href={permissionsUrl}>Permissions</a>
          </li>
          <li className={this.getNavItemClass('changes')}>
            <a id="changes" href={changesUrl}>Changes</a>
          </li>
          {docLinks}
          <li className={this.getNavItemClass('design-docs')}>
            <a
              id="design-docs"
              href={"#/" + databaseUrl + '?startkey="_design"&endkey="_design0"'}
              className="toggle-view">
              Design Documents
            </a>
            <div id="new-design-docs-button" className="add-dropdown">
              <Components.MenuDropDown links={buttonLinks} />
            </div>
          </li>
        </ul>
      );
    }

  });


  var IndexSection = React.createClass({

    propTypes: {
      urlNamespace: React.PropTypes.string.isRequired,
      database: React.PropTypes.object.isRequired,
      designDocName: React.PropTypes.string.isRequired,
      items: React.PropTypes.array.isRequired,
      isExpanded: React.PropTypes.bool.isRequired,
      selectedIndex: React.PropTypes.string.isRequired,
      onDelete: React.PropTypes.func.isRequired
    },

    createItems: function () {
      return _.map(this.props.items, function (indexName, key) {
        var href = FauxtonAPI.urls(this.props.urlNamespace, 'app', this.props.database.id, this.props.designDocName);
        var className = (this.props.selectedIndex === indexName) ? 'active' : '';

        return (
          <li className={className} key={key}>
            <a
              id={this.props.designDocName + '_' + indexName}
              href={"#/" + href + indexName}
              className="toggle-view">
              {indexName}
            </a>

            <OverlayTrigger
              ref="indexMenu"
              trigger="click"
              placement="bottom"
              rootClose={true}
              overlay={
                <Popover id="index-menu-component-popover">
                  <ul>
                    <li onClick={this.indexAction.bind(this, 'edit', { indexName: indexName, onEdit: this.props.onEdit })}>
                      <span className="fonticon fonticon-file-code-o"></span>
                      Edit
                    </li>
                    <li onClick={this.indexAction.bind(this, 'clone', { indexName: indexName, onClone: this.props.onDelete })}>
                      <span className="fonticon fonticon-files-o"></span>
                      Clone
                    </li>
                    <li onClick={this.indexAction.bind(this, 'delete', { indexName: indexName, onDelete: this.props.onDelete })}>
                      <span className="fonticon fonticon-trash"></span>
                      Delete
                    </li>
                  </ul>
                </Popover>
              }>
              <span className="index-menu-toggle fonticon fonticon-cog"></span>
            </OverlayTrigger>

          </li>
        );
      }, this);
    },

    indexAction: function (action, params) {
      // bah. We need to close the overlay trigger whenever the user clicks on anything inside. The
      // component doesn't seem to have that functionality, so we simulate a click outside of it :(
      $('body').trigger('click');

      if (action === 'delete') {
        Actions.showDeleteIndexModal(params.indexName, this.props.designDocName, params.onDelete);
        return;
      }

      if (action === 'edit') {
        params.onEdit(this.props.database.id, this.props.designDocName, params.indexName);
        return;
      }
    },

    toggle: function (e) {
      e.preventDefault();
      var newToggleState = !this.props.isExpanded;
      var state = newToggleState ? 'show' : 'hide';
      $(ReactDOM.findDOMNode(this)).find('.accordion-body').collapse(state);
      this.props.toggle(this.props.designDocName, this.props.title);
    },

    render: function () {

      // if this section has no content, omit it to prevent clutter. Otherwise it would show a toggle option that
      // would hide/show nothing
      if (this.props.items.length === 0) {
        return null;
      }

      var toggleClassNames = 'accordion-header index-group-header';
      var toggleBodyClassNames = 'index-list accordion-body collapse';
      if (this.props.isExpanded) {
        toggleClassNames += ' down';
        toggleBodyClassNames += ' in';
      }

      var title = this.props.title;
      var designDocName = this.props.designDocName;
      var linkId = "nav-design-function-" + designDocName + this.props.selector;

      return (
        <li id={linkId}>
          <a className={toggleClassNames} data-toggle="collapse" onClick={this.toggle}>
            <div className="fonticon-play"></div>
            {title}
          </a>
          <ul className={toggleBodyClassNames}>
            {this.createItems()}
          </ul>
        </li>
      );
    }
  });


  var DesignDoc = React.createClass({
    propTypes: {
      database: React.PropTypes.object.isRequired,
      sidebarListTypes: React.PropTypes.array.isRequired,
      isExpanded: React.PropTypes.bool.isRequired,
      selectedNavInfo: React.PropTypes.object.isRequired,
      toggledSections: React.PropTypes.object.isRequired
    },

    getInitialState: function () {
      return {
        updatedSidebarListTypes: this.props.sidebarListTypes
      };
    },

    editIndex: function (databaseName, designDocName, indexName) {
      FauxtonAPI.navigate('#' + FauxtonAPI.urls('view', 'edit', databaseName, designDocName, indexName));
    },

    componentWillMount: function () {
      if (_.isEmpty(this.state.updatedSidebarListTypes) ||
        (_.has(this.state.updatedSidebarListTypes[0], 'selector') && this.state.updatedSidebarListTypes[0].selector !== 'views')) {

        var newList = this.state.updatedSidebarListTypes;
        newList.unshift({
          selector: 'views',
          name: 'Views',
          urlNamespace: 'view',
          onDelete: IndexEditorActions.deleteView,
          onEdit: this.editIndex
        });
        this.setState({ updatedSidebarListTypes: newList });
      }
    },

    indexList: function () {
      return _.map(this.state.updatedSidebarListTypes, function (index, key) {
        var expanded = _.has(this.props.toggledSections, index.name) && this.props.toggledSections[index.name];

        // if an index in this list is selected, pass that down
        var selectedIndex = '';
        if (this.props.selectedNavInfo.designDocSection === index.name) {
          selectedIndex = this.props.selectedNavInfo.indexName;
        }

        return (
          <IndexSection
            icon={index.icon}
            isExpanded={expanded}
            urlNamespace={index.urlNamespace}
            onEdit={index.onEdit}
            onDelete={index.onDelete}
            selectedIndex={selectedIndex}
            toggle={this.props.toggle}
            database={this.props.database}
            designDocName={this.props.designDocName}
            key={key}
            title={index.name}
            selector={index.selector}
            items={_.keys(this.props.designDoc[index.selector])} />
        );
      }.bind(this));
    },

    toggle: function (e) {
      e.preventDefault();
      var newToggleState = !this.props.isExpanded;
      var state = newToggleState ? 'show' : 'hide';
      $(ReactDOM.findDOMNode(this)).find('#' + this.props.designDocName).collapse(state);
      this.props.toggle(this.props.designDocName);
    },

    getNewButtonLinks: function () {
      var newUrlPrefix = FauxtonAPI.urls('databaseBaseURL', 'app', this.props.database.id);
      var designDocName = this.props.designDocName;

      var addNewLinks = _.reduce(FauxtonAPI.getExtensions('sidebar:links'), function (menuLinks, link) {
        menuLinks.push({
          title: link.title,
          url: '#' + newUrlPrefix + '/' + link.url + '/' + designDocName,
          icon: 'fonticon-plus-circled'
        });
        return menuLinks;
      }, [{
        title: 'New View',
        url: '#' + FauxtonAPI.urls('new', 'addView', this.props.database.id, designDocName),
        icon: 'fonticon-plus-circled'
      }]);

      return [{
        title: 'Add New',
        links: addNewLinks
      }];
    },

    render: function () {
      var buttonLinks = this.getNewButtonLinks();
      var toggleClassNames = 'design-doc-section accordion-header';
      var toggleBodyClassNames = 'design-doc-body accordion-body collapse';

      if (this.props.isExpanded) {
        toggleClassNames += ' down';
        toggleBodyClassNames += ' in';
      }
      var designDocName = this.props.designDocName;
      var designDocMetaUrl = FauxtonAPI.urls('designDocs', 'app', this.props.database.id, designDocName);
      var metadataRowClass = (this.props.selectedNavInfo.designDocSection === 'metadata') ? 'active' : '';

      return (
        <li className="nav-header">
          <div id={"sidebar-tab-" + designDocName} className={toggleClassNames}>
            <div id={"nav-header-" + designDocName} onClick={this.toggle} className='accordion-list-item'>
              <div className="fonticon-play"></div>
              <p className='design-doc-name'>
                <span title={'_design/' + designDocName}>{designDocName}</span>
              </p>
            </div>
            <div className='new-button add-dropdown'>
              <Components.MenuDropDown links={buttonLinks} />
            </div>
          </div>
          <ul className={toggleBodyClassNames} id={this.props.designDocName}>
            <li className={metadataRowClass}>
              <a href={"#/" + designDocMetaUrl} className="toggle-view accordion-header">
                Metadata
              </a>
            </li>
            {this.indexList()}
          </ul>
        </li>
      );
    }
  });


  var DesignDocList = React.createClass({
    componentWillMount: function () {
      var list = FauxtonAPI.getExtensions('sidebar:list');
      this.sidebarListTypes = _.isUndefined(list) ? [] : list;
    },

    designDocList: function () {
      return _.map(this.props.designDocs, function (designDoc, key) {
        var ddName = designDoc.safeId;

        // only pass down the selected nav info and toggle info if they're relevant for this particular design doc
        var expanded = false,
          toggledSections = {};
        if (_.has(this.props.toggledSections, ddName)) {
          expanded = this.props.toggledSections[ddName].visible;
          toggledSections = this.props.toggledSections[ddName].indexGroups;
        }

        var selectedNavInfo = {};
        if (this.props.selectedNav.navItem === 'designDoc' && this.props.selectedNav.designDocName === ddName) {
          selectedNavInfo = this.props.selectedNav;
        }

        return (
          <DesignDoc
            toggle={this.props.toggle}
            sidebarListTypes={this.sidebarListTypes}
            isExpanded={expanded}
            toggledSections={toggledSections}
            selectedNavInfo={selectedNavInfo}
            key={key}
            designDoc={designDoc}
            designDocName={ddName}
            database={this.props.database} />
        );
      }.bind(this));
    },

    render: function () {
      return (
        <ul className="nav nav-list">
          {this.designDocList()}
        </ul>
      );
    }
  });


  var DeleteDBModalWrapper = React.createClass({
    componentDidMount: function () {
      this.dbModal = new DeleteDBModal({
        database: this.props.database,
        el: ReactDOM.findDOMNode(this),
        isSystemDatabase: app.utils.isSystemDatabase(this.props.database.id)
      });

      this.dbModal.render();
    },

    componentWillUnmount: function () {
      this.dbModal.remove();
    },

    componentWillReceiveProps: function (newProps) {
      this.dbModal.database = newProps.database;
      this.dbModal.isSystemDatabase = newProps.database.isSystemDatabase();
    },

    render: function () {
      return <div id="delete-db-modal"> </div>;
    }
  });


  var SidebarController = React.createClass({
    getStoreState: function () {
      return {
        database: store.getDatabase(),
        selectedNav: store.getSelected(),
        designDocs: store.getDesignDocs(),
        designDocList: store.getDesignDocList(),
        toggledSections: store.getToggledSections(),
        isLoading: store.isLoading(),
        deleteIndexModalVisible: store.isDeleteIndexModalVisible(),
        deleteIndexModalText: store.getDeleteIndexModalText(),
        deleteIndexModalOnSubmit: store.getDeleteIndexModalOnSubmit(),
        currentIndexName: store.getCurrentIndexName(),
        currentDesignDoc: store.getCurrentDesignDoc()
      };
    },

    getInitialState: function () {
      return this.getStoreState();
    },

    componentDidMount: function () {
      store.on('change', this.onChange, this);
    },

    componentWillUnmount: function () {
      store.off('change', this.onChange);
    },

    onChange: function () {
      if (this.isMounted()) {
        this.setState(this.getStoreState());
      }
    },

    // handles deleting of any index regardless of type. The delete handler and all relevant info is set when the user
    // clicks the delete action for a particular index
    deleteIndex: function () {
      this.state.deleteIndexModalOnSubmit({
        indexName: this.state.currentIndexName,
        designDoc: this.state.currentDesignDoc,
        designDocs: this.state.designDocs,
        database: this.state.database
      });
    },

    render: function () {
      if (this.state.isLoading) {
        return <LoadLines />;
      }
      return (
        <nav className="sidenav">
          <MainSidebar
            selectedNavItem={this.state.selectedNav.navItem}
            databaseName={this.state.database.id} />
          <DesignDocList
            selectedNav={this.state.selectedNav}
            toggle={Actions.toggleContent}
            toggledSections={this.state.toggledSections}
            designDocs={this.state.designDocList}
            database={this.state.database} />
          <DeleteDBModalWrapper
            database={this.state.database} />

          {/* these delete and clone index modals work for all index types. They work by the store storing
              index type-specific info/functions set when the user performs a particular action */}
          <ConfirmationModal
            visible={this.state.deleteIndexModalVisible}
            text={this.state.deleteIndexModalText}
            onClose={Actions.hideDeleteIndexModal}
            onSubmit={this.deleteIndex} />

          <CloneIndexModal
            visible={this.state.cloneIndexModalVisible}
            title={this.state.cloneIndexModalTitle}
            onClose={Actions.hideCloneIndexModal}
            onSubmit={this.state.cloneIndex}
            database={this.state.database}
            designDocPropName={this.state.getDesignDocPropName}
            designDocs={this.state.designDocs}
            defaultDesignDocName={this.state.defaultDesignDocName} />
        </nav>
      );
    }
  });


  var CloneIndexModal = React.createClass({
    propTypes: {
      visible: React.PropTypes.bool.isRequired,
      title: React.PropTypes.string,
      close: React.PropTypes.func.isRequired,
      submit: React.PropTypes.func.isRequired,
      database: React.PropTypes.object.isRequired,
      designDocPropName: React.PropTypes.string.isRequired,
      sourceIndexFunc: React.PropTypes.string.isRequired,
      designDocs: React.PropTypes.object.isRequired,
      defaultDesignDocName: React.PropTypes.string.isRequired
    },

    getDefaultProps: function () {
      return {
        title: 'Clone Index',
        visible: false
      };
    },

    getInitialState: function () {
      return {
        ddocName: '_design/' + this.props.defaultDesignDocName,
        indexName: ''
      };
    },

    submit: function () {
      if (!this.refs.designDocSelector.validate()) {
        return;
      }

      if (this.state.indexName === '') {
        FauxtonAPI.addNotification({
          msg: 'Please enter the new index name.',
          type: 'error',
          clear: true
        });
        return;
      }

      var designDoc = this.refs.designDocSelector.getDesignDoc();

      // check the index name isn't already taken in the target design doc
      var indexes = designDoc.get(this.props.designDocPropName);
      if (indexes && _.has(indexes, this.state.indexName)) {
        FauxtonAPI.addNotification({
          msg: 'That index name is already used in this design doc. Please enter a new name.',
          type: 'error',
          clear: true
        });
        return;
      }

      this.props.submit({
        targetDesignDoc: designDoc,
        sourceIndexFunc: this.props.sourceIndexFunc,
        designDocPropName: this.props.designDocPropName,
        indexName: this.state.indexName,
        designDocs: this.props.designDocs,
        database: this.props.database,
        onComplete: this.props.close
      });
    },

    setIndexName: function (e) {
      this.setState({ indexName: e.target.value });
    },

    onSelectDesignDoc: function (docName) {
      this.setState({ ddocName: docName });
    },

    render: function () {
      return (
        <Modal dialogClassName="clone-index-modal" show={this.props.visible} onHide={this.props.close}>
          <Modal.Header closeButton={true}>
            <Modal.Title>{this.props.title}</Modal.Title>
          </Modal.Header>
          <Modal.Body>

            <form className="form" method="post" onSubmit={this.submit}>
              <p>
                Use the form below to clone this index into the design doc of your choice.
              </p>

              <DesignDocSelector
                ref="designDocSelector"
                designDocs={this.props.designDocs}
                designDoc={Resources.Doc}
                database={this.props.database}
                selectedDDocName={this.state.ddocName}
                onSelectDesignDoc={this.onSelectDesignDoc} />

              <div className="clone-index-name-row">
                <label htmlFor="new-index-name">Index name</label>
                <input type="text" id="new-index-name" value={this.state.indexName} onChange={this.setIndexName}
                       placeholder="Enter new index name" />
              </div>
            </form>

          </Modal.Body>
          <Modal.Footer>
            <button onClick={this.props.close} data-bypass="true" className="btn cancel-button">
              <i className="icon fonticon-cancel-circled" /> Cancel</button>
            <button onClick={this.submit} data-bypass="true" className="btn btn-success save">
              <i className="icon fonticon-ok-circled" /> Clone</button>
          </Modal.Footer>
        </Modal>
      );
    }
  });


  return {
    SidebarController: SidebarController,
    DesignDoc: DesignDoc,
    CloneIndexModal: CloneIndexModal
  };

});
