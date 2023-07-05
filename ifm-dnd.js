(function () {
    let _shadowRoot;
    let _id;
    let _list;

    let tmpl = document.createElement("template");
    tmpl.innerHTML = `
        <style>
        </style>
        <div id="ui5_content" name="ui5_content">
         <slot name="content"></slot>
        </div>

        <script id="oView" name="oView" type="sapui5/xmlview">
            <mvc:View
			    controllerName="ifm.dnd"
				xmlns:l="sap.ui.layout"
				xmlns:mvc="sap.ui.core.mvc"
				xmlns="sap.m">
				<l:VerticalLayout
					class="sapUiContentPadding"
					width="100%">
					<l:content>
                        <Button
                            id="ifmListBtn"
                            class="sapUiTinyMarginBeginEnd"
                            icon="sap-icon://sort"
                            text="Sort List"
                            type="Default"
                            press="configList">
                        </Button>
					</l:content>
				</l:VerticalLayout>
			</mvc:View>
        </script>        
    `;

    class IFMDnD extends HTMLElement {

        constructor() {
            super();

            _shadowRoot = this.attachShadow({
                mode: "open"
            });
            _shadowRoot.appendChild(tmpl.content.cloneNode(true));

            _id = createGuid();

            _shadowRoot.querySelector("#oView").id = _id + "_oView";

            this._export_settings = {};
            this._export_settings.list = "";

            this.addEventListener("click", event => {
                console.log('click');
            });
        }

        connectedCallback() {
            try {
                if (window.commonApp) {
                    let outlineContainer = commonApp.getShell().findElements(true, ele => ele.hasStyleClass && ele.hasStyleClass("sapAppBuildingOutline"))[0]; // sId: "__container0"

                    if (outlineContainer && outlineContainer.getReactProps) {
                        let parseReactState = state => {
                            let components = {};

                            let globalState = state.globalState;
                            let instances = globalState.instances;
                            let app = instances.app["[{\"app\":\"MAIN_APPLICATION\"}]"];
                            let names = app.names;

                            for (let key in names) {
                                let name = names[key];

                                let obj = JSON.parse(key).pop();
                                let type = Object.keys(obj)[0];
                                let id = obj[type];

                                components[id] = {
                                    type: type,
                                    name: name
                                };
                            }

                            for (let componentId in components) {
                                let component = components[componentId];
                            }

                            let metadata = JSON.stringify({
                                components: components,
                                vars: app.globalVars
                            });

                            if (metadata != this.metadata) {
                                this.metadata = metadata;

                                this.dispatchEvent(new CustomEvent("propertiesChanged", {
                                    detail: {
                                        properties: {
                                            metadata: metadata
                                        }
                                    }
                                }));
                            }
                        };

                        let subscribeReactStore = store => {
                            this._subscription = store.subscribe({
                                effect: state => {
                                    parseReactState(state);
                                    return {
                                        result: 1
                                    };
                                }
                            });
                        };

                        let props = outlineContainer.getReactProps();
                        if (props) {
                            subscribeReactStore(props.store);
                        } else {
                            let oldRenderReactComponent = outlineContainer.renderReactComponent;
                            outlineContainer.renderReactComponent = e => {
                                let props = outlineContainer.getReactProps();
                                subscribeReactStore(props.store);

                                oldRenderReactComponent.call(outlineContainer, e);
                            }
                        }
                    }
                }
            } catch (e) { }
        }

        disconnectedCallback() {
            if (this._subscription) {
                this._subscription();
                this._subscription = null;
            }
        }

        onCustomWidgetBeforeUpdate(changedProperties) {
            if ("designMode" in changedProperties) {
                this._designMode = changedProperties["designMode"];
            }
        }

        onCustomWidgetAfterUpdate(changedProperties) {
            loadthis(this);
        }

        _firePropertiesChanged() {
            this.list = "";
            this.dispatchEvent(new CustomEvent("propertiesChanged", {
                detail: {
                    properties: {
                        list: this.list
                    }
                }
            }));
        }

        // SETTINGS
        get list() {
            return this._export_settings.list;
        }
        set list(value) {
            value = _list;
            this._export_settings.list = value;
        }

        static get observedAttributes() {
            return [
                "list"
            ];
        }

        attributeChangedCallback(name, oldValue, newValue) {
            if (oldValue != newValue) {
                this[name] = newValue;
            }
        }

    }
    customElements.define("ifm-dnd", IFMDnD);

    // UTILS
    function loadthis(that) {
        var that_ = that;

        let content = document.createElement('div');
        content.slot = "content";
        that_.appendChild(content);

        sap.ui.getCore().attachInit(function () {
            "use strict";

            //### Controller ###
            sap.ui.define([
                "jquery.sap.global",
                "sap/f/Card",
                "sap/ui/core/dnd/DragInfo",
                "sap/ui/core/dnd/DropInfo",
                "sap/ui/core/mvc/Controller"
            ], function (jQuery, Controller) {
                "use strict";

                return Controller.extend("ifm.dnd", {

                    onInit: function (oEvent) {
                    },

                    configList: function (oEvent) {
                        if (!this.oDefaultDialog) {
                            var modelList = new sap.ui.model.json.JSONModel();
                            modelList.setData(
                                {
                                    "listItems": [
                                        {
                                            "id": "Website",
                                            "description": "http://www.infomotion.de",
                                            "iconFile": "sap-icon://world"
                                        },
                                        {
                                            "id": "Telefon",
                                            "description": "+49 69 56608 3231",
                                            "iconFile": "sap-icon://call"
                                        },
                                        {
                                            "id": "Mail",
                                            "description": "david.wurm@infomotion.de",
                                            "iconFile": "sap-icon://business-card"
                                        }
                                    ]
                                }
                            );
                            sap.ui.getCore().setModel(modelList);

                            var ui5List = new sap.m.List({
                                items: {
                                    path: "/listItems",
                                    template: new sap.m.StandardListItem({
                                        title: "{id}",
                                        description: "{description}",
                                        iconFile: "{iconFile}"
                                    })
                                }
                            });
                            ui5List.addDragDropConfig(new sap.ui.core.dnd.DragInfo({
                                sourceAggregation: "items"
                            }));
                            ui5List.addDragDropConfig(new sap.ui.core.dnd.DropInfo({
                                targetAggregation: "items",
                                dropPosition: "Between",
                                dropLayout: "Vertical",
                                drop: function (oInfo) {
                                    var oDragged = oInfo.getParameter("draggedControl"),
                                        oDropped = oInfo.getParameter("droppedControl"),
                                        sInsertPosition = oInfo.getParameter("dropPosition"),
                                        iDragPosition = oGrid.indexOfItem(oDragged),
                                        iDropPosition = oGrid.indexOfItem(oDropped);

                                    ui5List.removeItem(oDragged);

                                    if (iDragPosition < iDropPosition) {
                                        iDropPosition--;
                                    };

                                    if (sInsertPosition === "After") {
                                        iDropPosition++;
                                    };

                                    ui5List.insertItem(oDragged, iDropPosition);
                                }
                            }));
                            var ui5Card = new sap.f.Card({
                                content: [ui5List]
                            });
                            this.oDefaultDialog = new sap.m.Dialog({
                                title: "Sort List Items",
                                content: [ui5Card],
                                beginButton: new sap.m.Button({
                                    text: "OK",
                                    press: function () {
                                        this.oDefaultDialog.close();
                                    }.bind(this)
                                }),
                                endButton: new sap.m.Button({
                                    text: "Close",
                                    press: function () {
                                        this.oDefaultDialog.close();
                                    }.bind(this)
                                })
                            });

                            // to get access to the controller's model
                            // that_.getView().addDependent(this.oDefaultDialog);
                        } else {
                            // handle update of list items
                        }

                        this.oDefaultDialog.open();
                        // _list = oView.byId("ifmListDnD").getValue();
                        // that._firePropertiesChanged();
                        // console.log(_list); 
                    },

                    onButtonPress: function (oEvent) {
                        _list = oView.byId("ifmListDnD").getValue();
                        that._firePropertiesChanged();
                        console.log(_list);

                        this.settings = {};
                        this.settings.list = "";

                        that.dispatchEvent(new CustomEvent("onStart", {
                            detail: {
                                settings: this.settings
                            }
                        }));
                    }
                });
            });

            //### THE APP: place the XMLView somewhere into DOM ###
            var oView = sap.ui.xmlview({
                viewContent: jQuery(_shadowRoot.getElementById(_id + "_oView")).html(),
            });
            oView.placeAt(content);


            if (that_._designMode) {
                oView.byId("ifmListDnD").setEnabled(false);
            }
        });
    }

    function createGuid() {
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
            let r = Math.random() * 16 | 0,
                v = c === "x" ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
})();