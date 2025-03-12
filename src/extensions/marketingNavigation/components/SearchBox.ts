export const addSearchBox = (siteUrl: string): string => {
    const searchBox = `
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css" />
        <style type="text/css">
            #sbcId { background: transparent !important; }
        </style>
        <script type="text/javascript">
            function onKeyUpEvent(ev) {
                if (ev !== null) {
                    if (ev.key === 'Enter' || ev.keyCode === 13) {
                        redirectToSearch();
                    }
                }
            }
            function redirectToSearch() {
                var valueText = document.getElementById('allSearchBox').value;
                if (valueText !== '') {
                    window.location.href = "${siteUrl}/SitePages/Search.aspx?q=" + valueText;
                }
            }
        </script>

        <div class="input-group">
            <input id="allSearchBox" placeholder="Search" class="form-control" style="padding: 4px 10px 3px;" onkeyup="onKeyUpEvent(event)"  />
            <button class="btn btn-warning" style="left: 0px; padding: 0px 10px;" type="button" onclick="redirectToSearch()">
                <i class="fa fa-search"></i>
            </button>
        </div>
    `;

    return searchBox;
}