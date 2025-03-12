import * as React from 'react';
import styles from './Search.module.scss';
import type { ISearchProps } from './ISearchProps';
import { Icon, IconButton, Label, Pivot, PivotItem, TextField } from '@fluentui/react';
import { spfi, SPFx } from '@pnp/sp';
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import "@pnp/sp/search";
import { SearchResults, SortDirection } from '@pnp/sp/search';
import { HttpClient, HttpClientResponse } from '@microsoft/sp-http';
import * as moment from 'moment';


const Search: React.FunctionComponent<ISearchProps> = (props: ISearchProps) => {

  const [pageSize, setPageSize] = React.useState<number>(50);
  const [isSPLastPage, setIsSPLastPage] = React.useState<boolean>(false);
  const [spPageNo, setSPPageNo] = React.useState<number>(1);
  const [spResults, setSPResults] = React.useState<any[]>([]);
  const [spCurrentResults, setSPCurrentResults] = React.useState<SearchResults>();
  const [isSnowLastPage, setIsSnowLastPage] = React.useState<boolean>(false);
  const [snowPageNo, setSnowPageNo] = React.useState<number>(1);
  const [snowResults, setSnowResults] = React.useState<any[]>([]);
  const [snowAPIKey, setSnowAPIKey] = React.useState<string>('');
  const [snowCIID, setSnowCIID] = React.useState<string[]>([]);
  const [isSnowConfigured, setIsSnowConfigured] = React.useState<boolean>(false);
  const [searchText, setSearchText] = React.useState<string>('');
  const [textValue, setTextValue] = React.useState<string>('');
  const [selectedPivotItem, setSelectedPivotItem] = React.useState<string>('sp');
  const [SiteCollectionURL, setSiteCollectionURL] = React.useState<any[]>([]);

  const mapSPSearchItem = (result: any): any => {
    return {
      Title: result.Title,
      Path: result.Path,
      Description: result.Description,
      Author: result.Author,
      Modified: result.LastModifiedTime
    };
  }

  const getReferences = async (): Promise<void> => {
    const sp = spfi().using(SPFx(props.context));
    const references = await sp.web.lists.getByTitle('References').items.select("ReferenceURL")();
    setSiteCollectionURL(references);
  }

  let sitecollectionpaths = SiteCollectionURL.map(SiteCollectionspath => `SiteName:"${SiteCollectionspath.ReferenceURL.Url}"`).join(" OR ");

  if (sitecollectionpaths !== "") {
    sitecollectionpaths = ` AND (${sitecollectionpaths})`;
  }

  const getSPSearchItems = async (): Promise<void> => {
    const sp = spfi().using(SPFx(props.context));

    const query = (searchText !== '') ? `*${searchText}*${sitecollectionpaths}` : `* ${sitecollectionpaths}`;
    const searchResults: SearchResults = await sp.search({
      Querytext: query,
      SelectProperties: ["Title", "Description", "Path", "Author", "LastModifiedTime"],
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

  const snowConfigurations = async (): Promise<void> => {
    const sp = spfi().using(SPFx(props.context));
    const _configItems = await sp.web.lists.getByTitle('Configurations').items.filter(`Title eq 'APIKey' or Title eq 'CIID'`)();
    if (_configItems.length > 0) {
      const _apikey = _configItems.filter(ci => { return ci.Title.toLowerCase() === "APIKey".toLowerCase(); });
      if (_apikey.length > 0) { setSnowAPIKey(_apikey[0].ConfigurationValue); }
      const _ciid = _configItems.filter(ci => { return ci.Title.toLowerCase() === "ciid" });
      if (_ciid.length > 0) { setSnowCIID(_ciid[0].ConfigurationValue.split(';')); }
    }
  }


  const mapSnowSearchItems = (item: any): any => {
    return {
      Title: item.short_description,
      Author: item['author.name'],
      PublishedDate: item.published,
      Description: item.description,
      Number: item.number,
      Id: item.sys_id,
      Url: item.u_url
    };
  }
  const checkSnowHasNext = (url: string): void => {
    props.context.httpClient.get(url, HttpClient.configurations.v1)
      .then((response: HttpClientResponse) => {
        if (response.ok) {
          response.json().then((data) => {
            if (data.result.length > 0) {
              setIsSnowLastPage(false);
            }
            else {
              setIsSnowLastPage(true);
            }
          }).catch(_ => { });
        }
      }).catch(_ => { });
  }
  const getSnowSearchItems = (): void => {
    if (snowAPIKey === '') return;
    const _offset: number = (snowPageNo - 1) * pageSize;
    const selectFields = `sys_id,number,short_description,description,published,author.name,meta_description,u_additional_editors.name,u_url`;
    const searchCIIDs: string[] = [];
    snowCIID.forEach(element => {
      searchCIIDs.push(`u_business_service.u_ci_id=${element}^ORu_service_offering.u_ci_id=${element}`);
    });
    const searchCIID = (searchCIIDs.length > 0) ? `(${searchCIIDs.join('^OR')})^` : '';
    const searchQuery: string = searchText ? `&sysparm_query=active=true^${searchCIID}short_descriptionLIKE${searchText}^ORmeta_descriptionLIKE${searchText}^ORdescriptionLIKE${searchText}^ORnumberLIKE${searchText}^ORDERBYDESCpublished` : `&sysparm_query=active=true^(${searchCIID})ORDERBYDESCpublished`;
    const url: string = `${props.description}?apikey=${snowAPIKey}&sysparm_offset=${_offset}&sysparm_limit=${pageSize}&syspram_fields=${selectFields}${searchQuery}`;
    console.log("url", url);
    props.context.httpClient.get(url, HttpClient.configurations.v1)
      .then((response: HttpClientResponse) => {
        if (response.ok) {
          response.json().then((data) => {
            const results = data.result.map(mapSnowSearchItems);
            setSnowResults(results);
            checkSnowHasNext(url);
          }).catch(_ => { });
        }
      }).catch(_ => { });
  }

  React.useEffect(() => {
    getReferences().then(_ => { }).catch(_ => { });
  }, []);


  React.useEffect(() => {
    setPageSize(50);
    const queryParams = new URLSearchParams(window.location.search);
    const _q = (queryParams.get('q') !== null) ? queryParams.get('q') as string : '';
    snowConfigurations().then(_ => { }).catch(_ => { });
    if (_q !== '') {
      setSearchText(decodeURIComponent(_q));
      setTextValue(decodeURIComponent(_q));
    }
    else {
      getSPSearchItems().then(_ => { }).catch(_ => { });
    }
  }, []);

  React.useEffect(() => {
    setIsSPLastPage(Math.ceil(spCurrentResults?.TotalRows as number / pageSize) === spPageNo);
  }, [spPageNo, spCurrentResults]);
  React.useEffect(() => {
    getPaginatedSPSearchItems().then(_ => { }).catch(_ => { });
  }, [spPageNo]);

  React.useEffect(() => {
    setIsSnowConfigured(snowAPIKey !== '');
  }, [snowAPIKey, snowCIID]);
  React.useEffect(() => {
    if (isSnowConfigured) {
      getSnowSearchItems();
    }
  }, [isSnowConfigured, snowPageNo]);

  React.useEffect(() => {
    if (selectedPivotItem === 'sp') {
      setSPPageNo(1);
      getSPSearchItems().then(_ => { }).catch(_ => { });
    }
    else if (selectedPivotItem === 'snow') {
      setSnowPageNo(1);
      getSnowSearchItems();
    }
  }, [searchText, SiteCollectionURL]);

  return (
    <div className={styles.landingPage}>
      <div className={styles.landingCenter}>
        <h2 className={styles.pageHead}>Search Result</h2>
        <article className={styles.mainContainer}>
          <div className={styles.searchContainer}>
            <TextField
              placeholder="Search..."
              underlined
              value={textValue} onKeyUp={(ev) => {
                if (ev.key === 'Enter')
                  setSearchText(textValue);
              }}
              onChange={(event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue?: string) => { setTextValue(newValue as string); }}
              onRenderSuffix={() => {
                return (
                  <>
                    {(textValue !== '') &&
                      <Icon iconName='Clear'
                        style={{ cursor: 'pointer', marginRight: '3px' }}
                        onClick={() => {
                          if (selectedPivotItem === 'sp') {
                            setTextValue('');
                            setSearchText('');
                            setSPPageNo(1);
                            getSPSearchItems().then(_ => { }).catch(_ => { });
                          }
                          else if (selectedPivotItem === 'snow') {
                            setTextValue('');
                            setSearchText('');
                            setSnowPageNo(1);
                            getSnowSearchItems();
                          }
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
          </div>
          <div className={styles.tabContainer}>
            <Pivot
              linkFormat="links"
              linkSize="large"
              styles={{
                link: styles.pivotLink,
                linkIsSelected: styles.tabActive,
              }}
              onLinkClick={(item?: PivotItem, ev?: React.MouseEvent<HTMLElement>) => {
                setSelectedPivotItem(item?.props.itemKey as string);
              }}
            >
              <PivotItem headerText="Sharepoint" itemKey='sp'>
                <Label className={styles.tabContentList}>
                  <ul>
                    {
                      spResults.map((item, index) => (
                        <li key={index}>
                          <div className={`${styles.spItem}`}>
                            <h3>{item.Title}</h3>
                            <div className={styles.searchLink}>
                              <a href={item.Path}>{item.Path}</a>
                            </div>
                            <div>{item.Description}</div>
                            <div><strong>Last Modified:</strong>{moment(item.Modified).format('MM-DD-YYYY')}</div>
                          </div>
                        </li>
                      ))
                    }
                  </ul>
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
                </Label>
              </PivotItem>
              <PivotItem headerText="Service now" itemKey='snow'>
                <Label className={styles.tabContentList}>
                  <ul>
                    {
                      snowResults.map((item, index) => (
                        <li key={index}>
                          <div className={`${styles.spItem}`}>
                            <h3>{item.Title}</h3>
                            <div className={styles.searchLink}>
                              <a href={`${item.Url}`}>{item.Number} - {item.Title}</a>
                            </div>
                            <div>{item.Description}</div>
                            <div><strong>Published:</strong>{moment(item.PublishedDate).format('MM-DD-YYYY')}</div>
                          </div>
                        </li>
                      ))
                    }
                  </ul>
                  <div className={styles.paginationHolder}>
                    <IconButton iconProps={{ iconName: 'ChevronLeftSmall' }}
                      disabled={snowPageNo === 1}
                      onClick={() => {
                        const _page = snowPageNo - 1;
                        setSnowPageNo(_page);
                      }}
                    />
                    <span className={`${styles.displayRecords}`}>
                      {`${((snowPageNo - 1) * pageSize) + 1}-${((snowPageNo - 1) * pageSize) + snowResults.length}`}
                    </span>
                    <IconButton iconProps={{ iconName: 'ChevronRightSmall' }}
                      disabled={isSnowLastPage}
                      onClick={() => {
                        const _page = snowPageNo + 1;
                        setSnowPageNo(_page);
                      }}
                    />
                  </div>
                </Label>
              </PivotItem>
            </Pivot>
          </div>
        </article>
      </div>
    </div>
  );
}
export default Search;
