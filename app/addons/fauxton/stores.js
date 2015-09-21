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
  'api',
  'addons/fauxton/actiontypes'
],

function (FauxtonAPI, ActionTypes) {
  var Stores = {};

  // static var used to assign a unique ID to each notification
  var counter = 0;
  var validNotificationTypes = ['success', 'error', 'warning', 'info'];


  /**
   * Notifications are of the form:
   * {
   *   notificationId: N,
   *   message: "string",
   *   type: "success"|etc. see above list
   *   clear: true|false,
   *   escape: true|false
   * }
   */

  Stores.NotificationStore = FauxtonAPI.Store.extend({
    initialize: function () {
      this.reset();
    },

    reset: function () {
      this._notifications = [];
    },

    addNotification: function (info) {
      if (_.empty(info.type) || _.contains(validNotificationTypes, info.type)) {
        console.warn('Invalid message type: ', info);
        return;
      }

      info.notificationId = ++counter;
      this._notifications.push(info);
    },

    getNotificationsByType: function (type) {
      return _.where(this._notifications, { type: type });
    },

    dispatch: function (action) {
      switch (action.type) {
        case ActionTypes.ADD_NOTIFICATION:
          this.addNotification(action.options.info);
          this.triggerChange();
        break;

        default:
        return;
        // do nothing
      }
    }
  });

  Stores.notificationStore = new Stores.NotificationStore();
  Stores.notificationStore.dispatchToken = FauxtonAPI.dispatcher.register(Stores.notificationStore.dispatch);

  return Stores;

});
