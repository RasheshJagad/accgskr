import * as React from 'react';
import styles from './Announcements.module.scss';
import type { IAnnouncementsProps } from './IAnnouncementsProps';
import { spfi, SPFx } from '@pnp/sp';
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import "@pnp/sp/search";
import { SearchResults, SortDirection } from '@pnp/sp/search';
import * as moment from 'moment';
import { Icon, IconButton, TextField } from '@fluentui/react';
import "@pnp/sp/site-users/web";


const Announcements: React.FunctionComponent<IAnnouncementsProps> = (props: IAnnouncementsProps) => {

  // const [rootSiteUrl, setRootSiteUrl] = React.useState<string>('');
  const [pageSize, setPageSize] = React.useState<number>(20);
  const [filterShow, setFilterShow] = React.useState(false);
  const [isSPLastPage, setIsSPLastPage] = React.useState<boolean>(false);
  const [spPageNo, setSPPageNo] = React.useState<number>(1);
  const [spResults, setSPResults] = React.useState<any[]>([]);
  const [spCurrentResults, setSPCurrentResults] = React.useState<SearchResults>();
  const [searchText, setSearchText] = React.useState<string>('');
  const [textValue, setTextValue] = React.useState<string>('');
  const [infoShowHide, setInfoShowHide] = React.useState<boolean>(false);
  const [isMobile, setIsMobile] = React.useState(false);
  const [referenceAllTitle, setreferenceAllTitle] = React.useState<{ Title: string, ReferenceURL: any, AuthorId: number }[]>([]);
  const [subscriptionItems, setSubscriptionItems] = React.useState<{ Title: string, AuthorId: number }[]>([]);



  const [UserID, SetUserID] = React.useState<any>();
  // const getRootSiteUrl = async () => {
  //   const sp = spfi().using(SPFx(props.context));
  //   const rootItem = await sp.web.lists.getByTitle('Configurations').items.filter(`Title eq 'RootSiteUrl'`).select('Title,ConfigurationValue')();
  //   if (rootItem.length > 0) {
  //     setRootSiteUrl(rootItem[0].ConfigurationValue);
  //   }
  // }

  const getReferences = async (): Promise<void> => {
    const sp = spfi().using(SPFx(props.context));
    const references = await sp.web.lists.getByTitle('References').items();
    setreferenceAllTitle(references);
  }
  const getAllSubscriptionsItem = async (): Promise<void> => {
    const sp = spfi().using(SPFx(props.context));
    const items = await sp.web.lists.getByTitle("Subscriptions").items();
    setSubscriptionItems(items)
  }

  const mapSPSearchItem = (result: any): any => {
    return {
      Title: result.Title,
      AnnouncementBodyOWSMTXT: result.AnnouncementBodyOWSMTXT,
      Path: result.Path,
      LastModifiedTime: moment(result.LastModifiedTime).format('MM-DD-YYYY'),
      ListItemId: result.ListItemId,
      SiteTitle: result.SiteTitle,
      SiteName: result.SiteName
    };
  }
  const getSPSearchItems = async (): Promise<void> => {
    const sp = spfi().using(SPFx(props.context));
    const _rs: string[] = [];
    referenceAllTitle.forEach(r => { _rs.push(`SiteName:"${r.ReferenceURL.Url}"`); });
    let refrenceFilter = _rs.join(' OR ');
    if (refrenceFilter !== "") {
      refrenceFilter = ` AND (${refrenceFilter})`;
    }
    let query = `ContentType:"Service Announcement"${refrenceFilter}`;
    if (searchText !== '') {
      query += `*${searchText}*`;
    }
    console.log("query", query);
    const searchResults: SearchResults = await sp.search({
      Querytext: query,
      SelectProperties: ["Title", "BodyOWSMTXT", "AnnouncementBodyOWSMTXT", "Path", "LastModifiedTime", "ListItemId", "SiteTitle", "SiteName"],
      RowLimit: pageSize,
      TrimDuplicates: false,
      SortList: [{ Property: "LastModifiedTime", Direction: SortDirection.Descending }]
    });
    if (typeof searchResults !== typeof undefined) {
      const results = searchResults.PrimarySearchResults.map(mapSPSearchItem);
      setSPCurrentResults(searchResults);
      setSPResults(results);
    }
  }
  const getPaginatedSPSearchItems = async (): Promise<void> => {
    const searchResults = await spCurrentResults?.getPage(spPageNo) as SearchResults;
    if (typeof searchResults !== typeof undefined) {
      const results = searchResults.PrimarySearchResults.map(mapSPSearchItem);
      setSPCurrentResults(searchResults);
      setSPResults(results);
    }
  }
  const checkifitemexistinSubscription = referenceAllTitle.map(refItem => {
    const isExist = subscriptionItems.some(subscriptionItem =>
      subscriptionItem.Title === refItem.Title && subscriptionItem.AuthorId === UserID
    )
    return {
      ...refItem, Exist: isExist
    };
  });
  
  const getuserID = async (): Promise<void> => {
    const sp = spfi().using(SPFx(props.context));
    const UserDetails = await sp.web.currentUser();
    SetUserID(UserDetails.Id);
  }

  React.useEffect(() => {
    console.log("referenceAllTitle", referenceAllTitle);
    getSPSearchItems().then(_ => { }).catch(_ => { });
    const mediaQuery = window.matchMedia('(max-width: 1000px)');
    setIsMobile(mediaQuery.matches);
    const handleResize = (): void => setIsMobile(mediaQuery.matches)
    mediaQuery.addEventListener('change', handleResize);
    return () => mediaQuery.removeEventListener('change', handleResize);
  }, [referenceAllTitle]);

  React.useEffect(() => {
    console.log("subscriptionItems", subscriptionItems);
    getReferences().then(_ => { }).catch(_ => { });
    const mediaQuery = window.matchMedia('(max-width: 1000px)');
    setIsMobile(mediaQuery.matches);
    const handleResize = (): void => setIsMobile(mediaQuery.matches)
    mediaQuery.addEventListener('change', handleResize);
    return () => mediaQuery.removeEventListener('change', handleResize);
  }, [subscriptionItems]);
  // Ensures function runs when either array changes

  React.useEffect(() => {
    setIsSPLastPage(Math.ceil(spCurrentResults?.TotalRows as number / pageSize) === spPageNo);
  }, [spPageNo, spCurrentResults]);
  React.useEffect(() => {
    getPaginatedSPSearchItems().then(_ => { }).catch(_ => { });
  }, [spPageNo]);

  React.useEffect(() => {
    setSPPageNo(1);
    getSPSearchItems().then(_ => { }).catch(_ => { });
  }, [searchText]);


  React.useEffect(() => {
    setPageSize(20);
    getuserID().then(_ => { }).catch(_ => { });
  }, []);

  React.useEffect(() => {
    console.log("UserID", UserID);
    getAllSubscriptionsItem().then(_ => { }).catch(_ => { });
  }, [UserID]);
  React.useEffect(() => { checkifitemexistinSubscription; }, [spResults]);

  const handleMouseEnter = (): void => {
    if (!isMobile) setInfoShowHide(true)
  }
  const handleMouseLeave = (): void => {
    if (!isMobile) setInfoShowHide(false)
  }
  const handleClick = (): void => {
    if (isMobile) setInfoShowHide(!infoShowHide)
  }


  function handelClick(): void {
    if (!filterShow) {
      document.addEventListener("click", handleOutsideClick, true)
    }
    setFilterShow(!filterShow);
  }

  function handleOutsideClick(): void {
    setFilterShow(false);
  }

  const GetSiteTitlefromReference = (siteUrl: any): any => {
    const filteredItems = referenceAllTitle.filter(item =>
      item.ReferenceURL && item.ReferenceURL.Url.toLowerCase().includes(`${siteUrl}`.toLowerCase())
    );
    if (filteredItems.length > 0) {
      // Return the matching titles
      const Titles = filteredItems.map(item => item.Title);
      return Titles// Return the string of matching titles
    } else {
      console.log("No items found containing the URL in the Title.");
      return " ";
    }
  }

  const insertSubscriptionItem = async (referenceItem: { Title: string, ReferenceURL: any, AuthorId: any }): Promise<void> => {
    try {
      const sp = spfi().using(SPFx(props.context));
      await sp.web.lists.getByTitle('Subscriptions').items.add({
        Title: referenceItem.Title,
        SiteCollectionURL: referenceItem.ReferenceURL
      });
      getAllSubscriptionsItem().then(_ => { }).catch(_ => { });
      alert(`You have subscribed to the announcement: ${referenceItem.Title}`);
    }
    catch (err) {
      console.error("Error subscribing to announcement:", err)

    }
  };

  const deleteSubscriptionItem = async (referenceItem: { Title: string, ReferenceURL: any, AuthorId: any }): Promise<void> => {
    try {
      const sp = spfi().using(SPFx(props.context));
      const items = await sp.web.lists.getByTitle("Subscriptions").items
        .filter(`Title eq '${referenceItem.Title}' and Author/Id eq '${UserID}'`)
        .select("Id", "Title", "Author/Title")
        .expand("Author")();


      if (items.length > 0) {
        items.map(async (item: any) => {
          await sp.web.lists.getByTitle("Subscriptions").items.getById(item.Id).delete();
          alert(`You have Un-subscribed to the announcement: ${referenceItem.Title}`);
        });
      }
      getAllSubscriptionsItem().then(_ => { }).catch(_ => { });
    }
    catch (err) {
      console.error("Error subscribing to announcement:", err);
    }
  };

  return (
    <div className={styles.landingPage}>
      <div className={styles.landingCenter}>
        <h2 className={styles.pageHead}>Announcements</h2>
        <article className={styles.announcementContainer}>
          <div className={styles.announcementBox}>
            <aside className={styles.searchBoxHolder}>
              <TextField
                placeholder="Search..."
                underlined
                value={textValue}
                onChange={(event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue?: string) => { setTextValue(newValue as string); }}
                onRenderSuffix={() => {
                  return (
                    <>
                      {(textValue !== '') &&
                        <Icon iconName='Clear'
                          style={{ cursor: 'pointer', marginRight: '3px' }}
                          onClick={(): void => {
                            setSearchText('');
                            setTextValue('');
                            setSPPageNo(1);
                            getSPSearchItems().then(_ => { }).catch(_ => { });
                          }}
                        />
                      }
                      <IconButton iconProps={{ iconName: 'SearchArt64' }}
                        onClick={() => {
                          setSearchText(textValue);
                        }}
                      />
                    </>
                  )
                }}
              />
            </aside>
            <aside className={styles.subscribeInfo} >
              <div className={styles.info} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}><span className={styles.infoTrigger} onClick={handleClick} >i</span>
                {infoShowHide &&
                  <div className={styles.infoMsg}>Lorem ipsum dolor sit amet, consectetur adipiscing elit,  ut labore et dolore magna aliqua. </div>
                }
              </div>

              <div id='subscribePopTrigger' className={styles.subscribefilter} onClick={handelClick}><span className={styles.subscribeBtn}>Subscribe</span>
                <div id='subscribePop' className={filterShow ? `${styles.showFilterPop} ${styles.filterPop}` : styles.filterPop} >
                  <strong>Services</strong>
                  <div>
                    {checkifitemexistinSubscription.map((item: any, index: number) => (

                      item.Exist ?
                        <span key={index} className={`${styles.filterItem} ${styles.subscritionbtnonClick}`} onClick={() => deleteSubscriptionItem(item)}> {item.Title}</span> :
                        <span key={index} className={`${styles.filterItem}`} onClick={() => insertSubscriptionItem(item)}> {item.Title} </span>

                    ))}


                    {/* <label className={styles.filterItem}><input type="checkbox" /><span>Lorem Ipsum</span></label>
                    <label className={styles.filterItem}><input type="checkbox" /><span>Lorem Ipsum</span></label>
                    <label className={styles.filterItem}><input type="checkbox" /><span>Lorem Ipsum</span></label>
                    <label className={styles.filterItem}><input type="checkbox" /><span>Lorem Ipsum</span></label> */}
                  </div>
                </div>
              </div>


            </aside>
          </div>
          <div>
            <ul className={`row ${styles.announcementList}`}>
              {
                spResults.map((announcement: any, index) => (
                  <li className='col-xl-3 col-lg-4 col-md-6  mb-5' key={index}>
                    <div className={styles.announcementItem}>
                      <div>
                        <h3 className={styles.itemHead}>{announcement.Title} </h3>
                        <p dangerouslySetInnerHTML={{ __html: announcement.AnnouncementBodyOWSMTXT }} />
                        {/* <span>{announcement.SiteName} </span>  */}

                        <span>{GetSiteTitlefromReference(announcement.SiteName)} </span>

                      </div>
                      <div>
                        <span className={styles.date}>{announcement.LastModifiedTime}</span>
                      </div>
                    </div>
                  </li>
                ))
              }
            </ul>
          </div>
          <div className={styles.paginationHolder}>
            <IconButton iconProps={{ iconName: 'ChevronLeftSmall' }}
              disabled={spPageNo === 1}
              onClick={() => {
                const _page = spPageNo - 1;
                setSPPageNo(_page);
              }}
            />
            <span className={`${styles.displayRecords}`}>
              {`${((spPageNo - 1) * pageSize) + 1}-${((spPageNo - 1) * pageSize) + spResults.length}`}
            </span>
            <IconButton iconProps={{ iconName: 'ChevronRightSmall' }}
              disabled={isSPLastPage}
              onClick={() => {
                const _page = spPageNo + 1;
                setSPPageNo(_page);
              }}
            />
          </div>
        </article>
      </div>
    </div>
  );
}

export default Announcements;