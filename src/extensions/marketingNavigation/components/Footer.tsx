import * as React from 'react';
import { ApplicationCustomizerContext } from '@microsoft/sp-application-base';
import styles from './Footer.module.scss';
import { spfi, SPFx } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import "@pnp/sp/presets/all";

export interface IFooterProps {
    context: ApplicationCustomizerContext;
    domElement: HTMLDivElement;
}

const Footer: React.FunctionComponent<IFooterProps> = (props: IFooterProps) => {

    const [navItems, setNavItems] = React.useState<any[]>([]);
    const [isSiteAdmin, setIsSiteAdmin] = React.useState<boolean>(true);

    const loadFooters = async (): Promise<void> => {
        const _sp = spfi().using(SPFx(props.context));
        const menuItems: any[] = await _sp.web.lists.getByTitle('Footers').items.select("Id", "Title", "NavigationURL").orderBy('Id', true)();
        setNavItems(menuItems);
    }

    const checkIfUserIsAdmin = async (): Promise<void> => {
        const _sp = spfi().using(SPFx(props.context));
        const currentUser = await _sp.web.currentUser();
        const ownersGroup = await _sp.web.associatedOwnerGroup();
        const ownersGroupUsers = await _sp.web.siteGroups.getById(ownersGroup.Id).users();
        const isInOwnersGroup = ownersGroupUsers.some(u => u.Id === currentUser.Id);
        setIsSiteAdmin(isInOwnersGroup);
    }

    React.useEffect(() => {
        checkIfUserIsAdmin().then(_ => { }).catch(_ => { });
        loadFooters().then(_ => { }).catch(_ => { });
    }, []);

    return (
        <div className={`${styles.footerWrapper}`}>
            {isSiteAdmin &&
                <a href={`${props.context.pageContext.site.absoluteUrl}/Lists/Footers`}>Edit</a>
            }
            {
                navItems.map((f: any) => (
                    <a key={f.Id} href={(f.NavigationURL !== '' && f.NavigationURL !== null && typeof f.NavigationURL !== typeof undefined) ? `${f.NavigationURL.Url}` : ``}>{f.Title}</a>
                ))
            }
        </div>
    );
}

export default Footer;