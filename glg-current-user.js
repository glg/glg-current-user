/*
  Renders the body content if, and only if, there is a current authenticated user present. The current user is
  exposed to the context. Reads the local authentication cookie, and only works internally.

  Example:

      <glg-current-user username="{{username}}" user="{{user}}">
        <template is="dom-if" if="{{user}}">
          <span>
            Hello <b>{{user.firstName}}</b> from <span>{{user.city}}</span>!
          </span>
        </template>
      </glg-current-user>

  An event 'user-changed' is fired when the user is fetched.
*/

Polymer({
  is: 'glg-current-user',
  properties: {
    /*
      Epiquery url used to get user details.
      See https://github.com/glg/epiquery-templates/blob/prod/glgCurrentUser/getUserByLogin.mustache
      for the available properties exposed on the `User` object.
    */
    url: {
      type: String,
      value: 'https://services.glgresearch.com/epistream-ldap/epiquery1/glglive/glgCurrentUser/getUserByLogin.mustache',
    },
    qs: {
      type: Object,
      computed: '_buildQueryString(username)',
      value: ''
    },
    username: {
      type: String,
      value: function() {
        var glgrootCookie = Cookies.getJSON('glgroot');
        var starphleetCookie = Cookies.getJSON('starphleet_user');
        var glgSAMCookie = Cookies.getJSON('glgSAM');
        var glguserCookie = Cookies.get('glguserinfo');
        return  this._extractUserName(glgrootCookie, starphleetCookie, glgSAMCookie, glguserCookie);
      },
      observer: '_usernameChanged',
      notify: true,
      reflect: true
    },
    // Property to bind to get the current user
    user: {
      type: Object,
      notify: true
    }
  },
  _domainifyUsername: function(name) {
    if (name.toLowerCase().indexOf('glgroup') === -1) {
      return "glgroup\\" + name;
    } else {
      return name;
    }
  },
  _handleUser: function(evt) {
    this.user = evt.detail.response[0];
  },
  _buildQueryString: function(name) {
    return {login : this._domainifyUsername(name)};
  },
  _usernameChanged: function(name) {
    if (window.glgUserCache[name]) {
      this.user = window.glgUserCache[name];
    }
    return this.debounce('fetch', (function(_this) {
      return function() {
        return _this.$.xhr.generateRequest();
      };
    })(this), 200);
  },
  _extractUserName: function(glgrootCookie, starphleetCookie, glgSAMCookie, glguserCookie) {
    if (typeof glgrootCookie == 'Object' && typeof glgrootCookie.username != 'undefined') {
      return glgrootCookie.username;
    } else if (typeof starphleetCookie == 'Object' && typeof starphleetCookie.username != 'undefined') {
      return starphleetCookie.username;
    } else if (typeof glgSAMCookie  == 'Object' && typeof glgSAMCookie.username != 'undefined') {
      return glgSAMCookie.username;
    } else if (glguserCookie != '') {
      try {
        return (JSON.parse(atob(glguserCookie))).username;
      }
      catch (err) {
        console.error("Failed to extract username from glguserinfo cookie: " + err);
        return '';
      }
    } else {
      return '';
    }
  },
  created: function() {
    window.glgUserCache = window.glgUserCache || {};
  }
});
