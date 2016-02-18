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
  'addons/documents/index-editor/stores',
  'addons/documents/index-editor/actions',
  'addons/fauxton/components',
  'addons/components/react-components.react'
],

function (app, FauxtonAPI, React, Stores, Actions, Components, ReactComponents) {
  var store = Stores.indexEditorStore;
  var getDocUrl = app.helpers.getDocUrl;
  var StyledSelect = ReactComponents.StyledSelect;
  var CodeEditorPanel = ReactComponents.CodeEditorPanel;
  var PaddedBorderedBox = ReactComponents.PaddedBorderedBox;
  var ConfirmButton = ReactComponents.ConfirmButton;
  var LoadLines = ReactComponents.LoadLines;


  var DesignDocSelector = React.createClass({

    getStoreState: function () {
      return {
        designDocId: store.getDesignDocId(),
        designDocs: store.getDesignDocs(),
        newDesignDoc: store.isNewDesignDoc()
      };
    },

    getInitialState: function () {
      return this.getStoreState();
    },

    getNewDesignDocInput: function () {
      return (
        <div className="new-ddoc-section">
          <div className="new-ddoc-input">
            <input value={this.state.designDoc} type="text" id="new-ddoc" onChange={this.onDesignDocChange} placeholder="Name" />
          </div>
        </div>
      );
    },

    onDesignDocChange: function (event) {
      Actions.designDocChange('_design/' + event.target.value, true);
    },

    getDesignDocOptions: function () {
      return this.state.designDocs.map(function (doc, i) {
        return <option key={i} value={doc.id}>{doc.id}</option>;
      });
    },

    getSelectContent: function () {
      var designDocOptions = this.getDesignDocOptions();

      return (
        <optgroup label="Select a document">
          <option value="new">New Design Document</option>
          {designDocOptions}
        </optgroup>
      );
    },

    render: function () {
      var designDocInput;
      var designDocId = this.state.designDocId;

      if (this.state.newDesignDoc) {
        designDocInput = this.getNewDesignDocInput();
        designDocId = 'new';
      }

      return (
        <div className="new-ddoc-section">
          <PaddedBorderedBox>
            <div className="control-group design-doc-group">
              <div className="pull-left">
                <label htmlFor="ddoc"><strong>Design Document</strong>
                  <a className="help-link" data-bypass="true" href={getDocUrl('DESIGN_DOCS')} target="_blank">
                    <i className="icon-question-sign">
                    </i>
                  </a>
                </label>
                <StyledSelect
                  selectContent={this.getSelectContent()}
                  selectChange={this.selectChange}
                  selectId="ddoc"
                  selectValue={designDocId}
                />
              </div>
              <div className="pull-left">
                {designDocInput}
              </div>
            </div>
          </PaddedBorderedBox>
        </div>
      );
    },

    selectChange: function (event) {
      var designDocId = event.target.value;

      if (designDocId === 'new') {
        Actions.newDesignDoc();
      } else {
        Actions.designDocChange(designDocId, false);
      }
    },

    onChange: function () {
      this.setState(this.getStoreState());
    },

    componentDidMount: function () {
      store.on('change', this.onChange, this);
    },

    componentWillUnmount: function () {
      store.off('change', this.onChange);
    }

  });

  var ReduceEditor = React.createClass({

    getStoreState: function () {
      return {
        reduce: store.getReduce(),
        reduceOptions: store.reduceOptions(),
        reduceSelectedOption: store.reduceSelectedOption(),
        hasCustomReduce: store.hasCustomReduce(),
        hasReduce: store.hasReduce()
      };
    },

    getInitialState: function () {
      return this.getStoreState();
    },

    getOptionsList: function () {
      return _.map(this.state.reduceOptions, function (reduce, i) {
        return <option key={i} value={reduce}>{reduce}</option>;
      }, this);
    },

    getReduceValue: function () {
      if (!this.state.hasReduce) {
        return null;
      }

      if (!this.state.hasCustomReduce) {
        return this.state.reduce;
      }

      return this.refs.reduceEditor.getValue();
    },

    getEditor: function () {
      return this.refs.reduceEditor.getEditor();
    },

    render: function () {
      var reduceOptions = this.getOptionsList(),
          customReduceSection;

      if (this.state.hasCustomReduce) {
        customReduceSection = <CodeEditorPanel
          ref='reduceEditor'
          id='reduce-function'
          title={'Custom Reduce function'}
          defaultCode={this.state.reduce}
          blur={this.updateReduceCode}
        />;
      }

      return (
        <div>
          <div className="control-group">
            <label htmlFor="reduce-function-selector">
              <strong>Reduce (optional)</strong>
              <a
                className="help-link"
                data-bypass="true"
                href={getDocUrl('REDUCE_FUNCS')}
                target="_blank"
              >
                <i className="icon-question-sign"></i>
              </a>
            </label>
            <StyledSelect
              selectContent={reduceOptions}
              selectChange={this.selectChange}
              selectId="reduce-function-selector"
              selectValue={this.state.reduceSelectedOption} />
          </div>

          {customReduceSection}
        </div>
      );
    },

    updateReduceCode: function (code) {
      Actions.updateReduceCode(code);
    },

    selectChange: function (event) {
      Actions.selectReduceChanged(event.target.value);
    },

    onChange: function () {
      this.setState(this.getStoreState());
    },

    componentDidMount: function () {
      store.on('change', this.onChange, this);
    },

    componentWillUnmount: function () {
      store.off('change', this.onChange);
    }
  });


  var Editor = React.createClass({
    getStoreState: function () {
      return {
        hasViewNameChanged: store.hasViewNameChanged(),
        originalViewName: store.getOriginalViewName(),
        database: store.getDatabase(),
        isNewView: store.isNewView(),
        viewName: store.getViewName(),
        designDocs: store.getDesignDocs(),
        hasDesignDocChanged: store.hasDesignDocChanged(),
        newDesignDoc: store.isNewDesignDoc(),
        designDocId: store.getDesignDocId(),
        map: store.getMap(),
        isLoading: store.isLoading()
      };
    },

    getInitialState: function () {
      return this.getStoreState();
    },

    onChange: function () {
      this.setState(this.getStoreState());
    },

    componentDidMount: function () {
      store.on('change', this.onChange, this);
    },

    componentWillUnmount: function () {
      store.off('change', this.onChange);
    },

    hasErrors: function () {
      var mapEditorErrors = this.refs.mapEditor.getEditor().hasErrors();
      var customReduceErrors = (store.hasCustomReduce()) ? this.refs.reduceEditor.getEditor().hasErrors() : false;
      return mapEditorErrors || customReduceErrors;
    },

    saveView: function (event) {
      event.preventDefault();

      if (this.hasErrors()) {
        FauxtonAPI.addNotification({
          msg: 'Please fix the Javascript errors and try again.',
          type: 'error',
          clear: true
        });
        return;
      }

      Actions.saveView({
        database: this.state.database,
        newView: this.state.isNewView,
        viewName: this.state.viewName,
        designDocId: this.state.designDocId,
        newDesignDoc: this.state.newDesignDoc,
        designDocChanged: this.state.hasDesignDocChanged,
        hasViewNameChanged: this.state.hasViewNameChanged,
        originalViewName: this.state.originalViewName,
        map: this.refs.mapEditor.getValue(),
        reduce: this.refs.reduceEditor.getReduceValue(),
        designDocs: this.state.designDocs
      });
    },

    viewChange: function (e) {
      Actions.changeViewName(e.target.value);
    },

    updateMapCode: function (code) {
      Actions.updateMapCode(code);
    },

    render: function () {
      if (this.state.isLoading) {
        return (
          <div className="define-view">
            <LoadLines />
          </div>
        );
      }

      var cancelLink = '#' + FauxtonAPI.urls('view', 'showView', this.state.database.id, this.state.designDocId, this.state.viewName);
      return (
        <div className="define-view">
          <form className="form-horizontal view-query-save" onSubmit={this.saveView}>
            <DesignDocSelector />
            <div className="control-group">
              <PaddedBorderedBox>
                <label htmlFor="index-name">
                  <strong>Index name</strong>
                  <a
                    className="help-link"
                    data-bypass="true"
                    href={getDocUrl('VIEW_FUNCS')}
                    target="_blank">
                    <i className="icon-question-sign"></i>
                  </a>
                </label>
                <input
                  type="text"
                  id="index-name"
                  value={this.state.viewName}
                  onChange={this.viewChange}
                  placeholder="Index name" />
              </PaddedBorderedBox>
            </div>
            <div className="control-group">
              <PaddedBorderedBox>
                <CodeEditorPanel
                  id={'map-function'}
                  ref="mapEditor"
                  title={"Map function"}
                  docLink={getDocUrl('MAP_FUNCS')}
                  blur={this.updateMapCode}
                  allowZenMode={false}
                  defaultCode={this.state.map} />
              </PaddedBorderedBox>
            </div>
            <PaddedBorderedBox>
              <ReduceEditor ref="reduceEditor" />
            </PaddedBorderedBox>
            <div className="padded-box">
              <div className="control-group">
                <ConfirmButton id="save-view" text="Save Document and Build Index" />
                <a href={cancelLink} className="index-cancel-link">Cancel</a>
              </div>
            </div>
          </form>
        </div>
      );
    }
  });

  var EditorController = React.createClass({
    render: function () {
      return (
        <div className="editor-wrapper">
          <Editor />
        </div>
      );
    }
  });

  var Views = {
    EditorController: EditorController,
    ReduceEditor: ReduceEditor,
    Editor: Editor,
    DesignDocSelector: DesignDocSelector,
    StyledSelect: StyledSelect
  };

  return Views;
});
