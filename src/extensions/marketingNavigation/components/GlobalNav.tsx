import * as React from 'react';
import { ApplicationCustomizerContext } from '@microsoft/sp-application-base';
import { spfi, SPFx } from "@pnp/sp";
import "@pnp/sp/sites";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import "@pnp/sp/presets/all";
import * as $ from 'jquery';
import styles from './GlobalNav.module.scss';
import { addSearchBox } from './SearchBox';
require('../../../../node_modules/bootstrap/dist/css/bootstrap.min.css');


export interface IGlobalNavProps {
    context: ApplicationCustomizerContext;
    domElement: HTMLDivElement;
}

const GlobalNav: React.FunctionComponent<IGlobalNavProps> = (props: IGlobalNavProps) => {
    let timeHandler: any = null;
    let timeSideHandler: any = null;
    let timeBottomHandler: any = null;
    const [navItems, setNavItems] = React.useState<any[]>([]);
    const [isSiteAdmin, setIsSiteAdmin] = React.useState<boolean>(true);
    const [siteTitle, setSiteTitle] = React.useState<string>('');

    const loadNavigations = async (): Promise<void> => {
        const _sp = spfi().using(SPFx(props.context));
        const menuItems: any[] = await _sp.web.lists.getByTitle('Navigations').items.expand('NavigationParent').select("Id", "Title", "NavigationURL", "NavigationParentId", "NavigationParent/Id", "NavigationParent/Title").orderBy('Id', true)();
        setNavItems(menuItems);
    }

    const checkIfParent = (filter: string): boolean => {
        const c_ = navItems.some(_ => { return ((_.NavigationParentId !== null) ? _.NavigationParentId.toString() : "") === filter.toString() });
        return c_;
    }
    const setControls = (result: any): void => {
        let _href = "";
        if (result.NavigationURL !== '' && result.NavigationURL !== null && typeof result.NavigationURL !== typeof undefined) {
            _href = result.NavigationURL.Url
        }
        if (_href === `${window.location.origin}/`) { _href = props.context.pageContext.site.absoluteUrl; }
        _href = _href.replace(`${window.location.origin}/SitePages`, `${props.context.pageContext.site.absoluteUrl}/SitePages`);
        if (checkIfParent(result.Id.toString())) {
            if (result.NavigationParentId === null) {
                $(`#globalnav`).append(`<li class=${styles.hasDropmenu}><a><strong>${result.Title}</strong></a>
                    <div class="${styles.dropMenuCustom}">
                        <ul id="parent${result.Id}" class="${styles.dropMenuCustomGrid}">
                        </ul>
                    </div>
                </li>`);
            }
            else {
                $(`#globalnav #parent${result.NavigationParentId}`).append(`<li class="${styles.dropMenuCustomGridItem}">
                    <a href="${_href}">${result.Title}</a>
                    <div class="${styles.SubdropMenuCustom}"><ul id="parent${result.Id}" class="${styles.dropMenuCustomGrid}"></ul></div>
                </li>`);
            }
        }
        else {
            if (typeof result.NavigationParentId === typeof undefined || result.NavigationParentId === null) {
                $(`#globalnav`).append(`<li><a href="${_href}"><strong>${result.Title}</strong></a></li>`);
            }
            else {
                $(`#globalnav #parent${result.NavigationParentId}`).append(`<li class="${styles.dropMenuCustomGridItem}"><a href="${_href}">${result.Title}</a></li>`);
            }
        }
    }
    const getChildData = (filter: string): void => {
        const childData = navItems.filter((_) => { return ((_.NavigationParentId !== null) ? _.NavigationParentId.toString() : "") === filter.toString() });
        childData.forEach(cD => {
            setControls(cD);
            getParentData(cD.Id, false);
        });
    }
    const getParentData = (filter: string, isUndefined: boolean): void => {
        const parentData = navItems.filter((_) => { return (_.NavigationParentId === null && isUndefined === true) || ((_.NavigationParentId !== null) ? _.NavigationParentId.toString() : " ") === filter.toString() });
        parentData.forEach(pD => {
            setControls(pD);
            getChildData(pD.Id.toString());
        });
    }
    const jQueryLoad = (): void => {
        $(`.${styles.SubdropMenuCustom}`).each(function () {
            if ($(window).width() as number > 1100) {
                $(this).append(`<span class="${styles.sideArrow}"></span>`);
            }
        });
        $(`.${styles.dropMenuCustomGridItem}`).each(function () {
            if ($(this).children(`.${styles.SubdropMenuCustom}`).length > 0) {
                $(this).addClass(`${styles.hasSubmenu}`)
            }
        });

        $(document).on('mouseenter', `.${styles.dropMenuCustomGridItem}`, function (ctrl) {
            if ($(window).width() as number > 1100) {
                const $this = $(ctrl.currentTarget);
                const sideArrowPosition = $this.position().top;
                const findParent = $this.children('a');
                if ($this.children(`.${styles.SubdropMenuCustom}`).length > 0 && $this.parent().parent().children(`.${styles.SubdropMenuCustom}`).length === 0) {
                    $this.children(`.${styles.SubdropMenuCustom}`).clone().appendTo($this.parent().parent()).addClass(`${styles.cloneItem}`).show().css('top', sideArrowPosition + 'px').hover(function () { findParent.addClass(`${styles.active}`) }, function () { findParent.removeClass(`${styles.active}`) });
                }
            }
        });
        $(document).on('mouseleave', `.${styles.dropMenuCustomGridItem}`, function (event) {
            const $this = $(event.currentTarget);
            const sideArrow = $(document).find(`.${styles.sideArrow}`);
            if ($(window).width() as number > 1100) {
                if (!event.relatedTarget) return;
                if (!$(event.relatedTarget).is(`.${styles.cloneItem}`) && !$(event.relatedTarget).is(sideArrow)) {
                    $this.parent().parent().children(`div.${styles.cloneItem}`).remove();
                }
            }
        });
        $(document).on('mouseleave', `.${styles.cloneItem}`, function (ctrl) {
            const $this = $(ctrl.currentTarget);
            if ($(window).width() as number > 1100) {
                $this.remove();
                //$(document).find(`div.${styles.cloneItem}`).remove();
            }
        });
        $(`.${styles.navBar}>li`).each(function () {
            if ($(window).width() as number < 1100) {
                if ($(this).find(`.${styles.dropMenuCustom}`).length > 0) {
                    $(this).addClass(`${styles.hasDropmenu}`)
                    $(this).append(`<i class="${styles.expanCollaps}"></i>`);
                }
            }
        });
        $(`.${styles.dropMenuCustomGridItem}`).each(function () {
            if ($(window).width() as number < 1100) {
                if ($(this).find(`.${styles.SubdropMenuCustom}`).length > 0) {
                    $(this).append(`<i class="${styles.expanCollaps}"></i>`);
                }
            }
        });
        $(`.${styles.expanCollaps}`).on('click', function (ctrl) {
            const $this = $(ctrl.currentTarget);
            if ($(window).width() as number < 1100) {
                $this.parent('li').children('div').slideToggle();
                $this.toggleClass(`${styles.expanCollapsActive}`).css('zIndex', '9');
            }
        });
        $('#navTrigger').on('click', function () {
            $(`.${styles.navWrap2}`).addClass(`${styles.navWrap2Show}`);
        });
        $(`.${styles.navClose}`).on('click', function () {
            $(`.${styles.navWrap2}`).removeClass(`${styles.navWrap2Show}`);
        });
    }

    const embedSearch = (): void => {
        const formDiv = $('#sbcId');//.find('form[role="search"]').parent();
        $('#sbcId').empty();
        $(formDiv).append(addSearchBox(props.context.pageContext.site.absoluteUrl));
    }

    const stopTimeHandler = (): void => {
        clearInterval(timeHandler);
    }
    const stopTimeSideHandler = (): void => {
        clearInterval(timeSideHandler);
    }
    const stopTimeBottomHandler = (): void => {
        clearInterval(timeBottomHandler);
    }
    const setTimeHandler = (): void => {
        timeHandler = setInterval(() => {
            if ($(props.domElement).closest(`div[data-sp-placeholder="Top"]`).find('#gskheaderelement').length > 0) {
                $(props.domElement).closest(`div[data-sp-placeholder="Top"]`).find('#gskheaderelement').closest(`div.ms-SPLegacyFabricBlock`).remove();
                stopTimeHandler();
            }
        }, 100);
    }
    const setTimeSideHandler = (): void => {
        timeSideHandler = setInterval(() => {
            if ($('#sp-appBar').length > 0) {
                $('#sp-appBar').remove();
                stopTimeSideHandler();
            }
        }, 100);
    }
    const setTimeBottomHandler = (): void => {
        timeBottomHandler = setInterval(() => {
            if ($('#gskfooterelement').length > 0) {
                $('#gskfooterelement').closest('div.ms-SPLegacyFabricBlock').remove();
                stopTimeBottomHandler();
            }
        }, 100);
    }
    const embedHTML = (): void => {
        if ($('#mainWrapper').length < 1) {
            $(props.domElement).closest(`div[data-sp-placeholder="Top"]>div`).append(`
                <div class="ms-SPLegacyFabricBlock">
                    <div id='mainWrapper'>
                        <div class="${styles.headerWrapper}">
                            <h6 class="${styles.headerText}">${siteTitle}</h6>
                        </div>
                    </div>
                </div>
            `);
        }
        else {
            $('#mainWrapper>div>h6').text(siteTitle);
        }
        if ($('#globalnav').length < 1) {
            $(props.domElement).closest(`div[data-sp-placeholder="Top"]>div`).append(`<div class="ms-SPLegacyFabricBlock"><div class="${styles.navWrap}"><i class="${styles.navTrigger}" id="navTrigger"><span>Menu</span></i><div class="${styles.navWrap2}"><span class="${styles.navClose}"></span><ul class="${styles.navBar}" id="globalnav"></ul></div></div></div>`);
            getParentData("", true);
            jQueryLoad();
            $.each($(props.domElement).closest(`div[data-sp-placeholder="Top"]`).find(`.${styles.navWrap}`), function (i, el) {
                if ($(el).find('#globalnav li').length <= 0) {
                    try {
                        $(el).remove();
                    } catch (err) { console.log(err); }
                }
            });
        }
        embedSearch();
        $('#mainWrapper').parent().prependTo($(props.domElement).closest(`div[data-sp-placeholder="Top"]>div`));
        $(props.domElement).closest(`div[data-sp-placeholder="Top"]`).next('div#spSiteHeader').hide();
        $(props.domElement).closest(`div[data-sp-placeholder="Top"]`).next('div.Files-main').find('div.od-Files-topBar').hide();
    }

    const checkIfUserIsAdmin = async (): Promise<void> => {
        const _sp = spfi().using(SPFx(props.context));
        const currentUser = await _sp.web.currentUser();
        const ownersGroup = await _sp.web.associatedOwnerGroup();
        const ownersGroupUsers = await _sp.web.siteGroups.getById(ownersGroup.Id).users();
        const isInOwnersGroup = ownersGroupUsers.some(u => u.Id === currentUser.Id);
        setIsSiteAdmin(isInOwnersGroup);
    }

    const getSiteTitle = async (): Promise<void> => {
        const _sp = spfi().using(SPFx(props.context));
        const _site = await _sp.site.getRootWeb();
        const _siteProps = await _site.select('Title')();
        setSiteTitle(_siteProps.Title);
    }

    React.useEffect(() => { getSiteTitle().then(_ => { }).catch(_ => { }); }, []);
    React.useEffect(() => { loadNavigations().then(_ => { }).catch(_ => { }); }, [siteTitle]);
    React.useEffect(() => {
        embedHTML();
        setTimeHandler();
        setTimeSideHandler();
        setTimeBottomHandler();
        checkIfUserIsAdmin().then(_ => { }).catch(_ => { });
    }, [navItems]);
    React.useEffect(() => {
        if (isSiteAdmin) {
            $('#spCommandBar').show();
        }
        else {
            $('#spCommandBar').hide();
        }
    }, [isSiteAdmin]);

    return (
        <></>
    );
}

export default GlobalNav;