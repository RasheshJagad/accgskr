import * as React from 'react';
import * as ReactDOM from "react-dom";
import {
  //PlaceholderContent,
  PlaceholderName,
  BaseApplicationCustomizer,
  ApplicationCustomizerContext,
  PlaceholderContent
} from '@microsoft/sp-application-base';
//import * as $ from 'jquery'
import GlobalNav from './components/GlobalNav';
import { IGlobalNavProps } from "./components/GlobalNav";
import Footer, { IFooterProps } from './components/Footer';

/**
 * If your command set uses the ClientSideComponentProperties JSON input,
 * it will be deserialized into the BaseExtension.properties object.
 * You can define an interface to describe it.
 */
export interface IMarketingNavigationApplicationCustomizerProperties {
  // This is an example; replace with your own property
  context: ApplicationCustomizerContext;
}

/** A Custom Action which can be run during execution of a Client Side Application */
export default class MarketingNavigationApplicationCustomizer extends BaseApplicationCustomizer<IMarketingNavigationApplicationCustomizerProperties> {
  private _topPlaceholder: PlaceholderContent | undefined;
  private _bottomPlaceholder: PlaceholderContent | undefined;
  public onInit(): Promise<void> {
    console.log("onInit", window.location.href.toLowerCase().indexOf('mode=edit'));

    this.context.placeholderProvider.changedEvent.add(this, this._renderPlaceHolders);
    return Promise.resolve();
  }
  private _renderPlaceHolders(): void {
    if (!this._topPlaceholder) {
      this._topPlaceholder = this.context.placeholderProvider.tryCreateContent(
        PlaceholderName.Top,
        { onDispose: this._onDisposeTop }
      );
    }
    if (!this._topPlaceholder) { return; }
    const elemTop: React.ReactElement<IGlobalNavProps> = React.createElement(GlobalNav, { context: this.context, domElement: this._topPlaceholder.domElement });
    ReactDOM.render(elemTop, this._topPlaceholder.domElement);
    if (!this._bottomPlaceholder) {
      this._bottomPlaceholder = this.context.placeholderProvider.tryCreateContent(
        PlaceholderName.Bottom,
        { onDispose: this._onDisposeBottom }
      );
    }
    if (!this._bottomPlaceholder) { return; }
    const elemBottom: React.ReactElement<IFooterProps> = React.createElement(Footer, { context: this.context, domElement: this._bottomPlaceholder.domElement });
    ReactDOM.render(elemBottom, this._bottomPlaceholder.domElement);
  }
  private _onDisposeTop(): void {
    ReactDOM.unmountComponentAtNode(this._topPlaceholder?.domElement as HTMLDivElement);
    console.log('Disposed custom top placeholders.');
  }
  private _onDisposeBottom(): void {
    ReactDOM.unmountComponentAtNode(this._bottomPlaceholder?.domElement as HTMLDivElement);
    console.log('Disposed custom Bottom placeholders.');
  }
}
