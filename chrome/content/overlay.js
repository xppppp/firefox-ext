if (typeof wallabagAPI == "undefined") {
	var wallabagAPI = {
		_prefs: Components.classes["@mozilla.org/preferences-service;1"]
			.getService(Components.interfaces.nsIPrefService).getBranch("extensions.wallabag.api@idealworldinc.com."),

		showNotification: function(nText) {
			var nBox = gBrowser.getNotificationBox();
			var nInstance = nBox.getNotificationWithValue('wallabag-api');
			if (nInstance) {
			    nInstance.label = nText;
			} else {
			    nInstance = nBox.appendNotification(nText, 'wallabag-api',
						    'chrome://wallabag/skin/icon.png',
						    nBox.PRIORITY_INFO_HIGH,
						    null);
			}
			setTimeout(function() {
			    nBox.removeNotification(nInstance);
			}, 5000);
		},

		installButton: function (toolbarId, id, afterId) {
				if (!document.getElementById(id)) {
						var toolbar = document.getElementById(toolbarId);

						// If no afterId is given, then append the item to the toolbar
						var before = null;
						if (afterId) {
								var elem = document.getElementById(afterId);
								if (elem && elem.parentNode == toolbar)
										before = elem.nextElementSibling;
						}

						toolbar.insertItem(id, before);
						toolbar.setAttribute("currentset", toolbar.currentSet);
						document.persist(toolbar.id, "currentset");

						if (toolbarId == "addon-bar")
								toolbar.collapsed = false;
				}
		},

		postWindow: function(event) {
			var url = content.document.location.href;

			var width = 600;
			var height = 390;
			var left = window.mozInnerScreenX + (window.innerWidth - width) / 2;
			var top = window.mozInnerScreenY + (window.innerHeight - height) / 2;
			window.open(this._prefs.getCharPref("url") + "?action=add&url=" + btoa(url),
				    "", "height=" + height + ",width=" + width + ",top=" + top + ",left=" + left + ",toolbar=no,menubar=no,scrollbars=no,status=no,dialog,modal");
		},

		post: function(event) {
		    let un = this._prefs.prefHasUserValue('username') ? 
			this._prefs.getCharPref('username') : null;
		    let pass = this._prefs.prefHasUserValue('password') ? 
			this._prefs.getCharPref('password') : null;
		    let pUrl = this._prefs.prefHasUserValue('url') ? 
			this._prefs.getCharPref('url') : null;
		    if (pUrl && pUrl.length) {
			if (un && un.length && pass && pass.length) {
			    var url = content.document.location.href;
			    var postXHR = new XMLHttpRequest();
			    postXHR.addEventListener('load', function (xe) {
				if (postXHR.status == 200) {
				    try {
					let rObj = 
					    JSON.parse(postXHR.responseText);
					if (rObj.status == 0) {
					    wallabagAPI.showNotification('Added link ' + rObj.message);
					} else {
					    wallabagAPI.showNotification('Problem adding link ' + rObj.message);
					}
				    }
				    catch (te) {
					wallabagAPI.showNotification('Response error ' + te.message);
				    }
				}
			    });
			    postXHR.addEventListener('error', function (xe) {
				wallabagAPI.showNotification('Error posting URL: ' + xe.message + ', tryinv via web.');
				wallabagAPI.postWindow(event);
			    });
			    postXHR.addEventListener('abort', function (xe) {
				wallabagAPI.showNotification('URL post aborted.');
			    });
			    postXHR.open('POST', pUrl + 'api.php', true);
			    var formData = new FormData();
			    formData.append('action', 'add');
			    formData.append('login', un);
			    formData.append('password', pass);
			    formData.append('url', btoa(url));
			    postXHR.send(formData);
			} else {
			    wallabagAPI.showNotification('No username or password configured, trying via web.');
			    wallabagAPI.postWindow(event);
			}
		    } else {
			wallabagAPI.showNotification('Need to configure wallabag extension.');
		    }
		    event.stopPropagation();
		},

		open: function(event) {
			gBrowser.selectedTab = gBrowser.addTab(this._prefs.getCharPref("url"));
			event.stopPropagation();
		}
	};

	window.addEventListener("load", function() {
		Application.getExtensions(function(extensions) {
			var extension = extensions.get("wallabag.api@idealworldinc.com");
			if (extension.firstRun) {
				wallabagAPI.installButton("nav-bar", "wallabag-toolbar-button");
			}
		});
	}, false);
}
