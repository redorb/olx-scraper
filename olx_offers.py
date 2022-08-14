import json
import argparse
from pathlib import Path
from itertools import count

import lxml
import requests
import bs4 as bs
import pandas as pd
from rich import print
from rich.panel import Panel
from urllib.parse import urlparse

"""
useful:
    https://stackoverflow.com/questions/34253996/are-infinite-for-loops-possible-in-python
    https://stackoverflow.com/questions/5074803/retrieving-parameters-from-a-url
    https://www.freecodecamp.org/news/python-json-how-to-convert-a-string-to-json/
    https://codebeautify.org/htmlviewer
    https://github.com/github/gitignore/blob/main/Python.gitignore
    https://sparkbyexamples.com/pandas/pandas-append-list-as-a-row-to-dataframe/
    
you will encounter errors if url startswith:
    https://www.olx.pl/nieruchomosci
it should be:
    https://www.olx.pl/d/nieruchomosci
    
"""

def get_all_offers(url):
    """get all ads from single page"""
    parsed_url = urlparse(url)
    if not parsed_url.query:
        # query does not exist; no ? character in url
        marker = '?'
    else:
        marker = '&'
        
    total_urls = []
    for index in count(0):
        if not index:
            url_page = url
        else:
            current_page = '{}page={}'.format(marker, index)
            url_page = url + current_page
        print('{}) {}'.format(index, url_page))
        urls = get_offers_from_single_page(url_page)
        if not urls:
            break
            
        total_urls.extend(urls)
        print('index: {:02}, ads: {:02}'.format(index, len(urls)))
        
    # items per page may be wrong, but total unique is correct
    total_urls = list(set(total_urls))
    return total_urls
    
    
def extract_data_from_ads(total_urls, df):
    """extract data(cost & position) from specified urls(ads)
    
    todo:
        spawn tasks for asyncio and wait for execution
    """
    for key, single_ad_url in enumerate(total_urls):
        print('{:03}) {}'.format(key, single_ad_url))
        if (df['url'] == single_ad_url).any():
            print('    [green]\[*] already exists')
            continue
        else:
            price, latitude, longitude = get_details_from_single_offer(single_ad_url)
            print('    {} [PLN], geo: ({}, {})'.format(price, latitude, longitude))
            df.loc[len(df)] = [single_ad_url, price, latitude, longitude]
    return df
    
    
def get_offers_from_single_page(url):
    """get offers from single page; max 40 offers per page"""
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36'}
    try:
        res = requests.get(url, headers=headers)
    except requests.exceptions.MissingSchema as err:
        print('[red]requests.exceptions.MissingSchema: {}'.format(err))
        return []
        
    if res.history:
        # redirect from non existing page: [<Response [301]>]
        return []
    soup = bs.BeautifulSoup(res.text, 'lxml')
    offers_div = soup.find('div', {'data-testid':"listing-grid"})
    offers = offers_div.find_all('div', {'data-cy':"l-card"})
    urls = []
    olx_base_url = 'https://www.olx.pl'
    olx_offer_pattern = '/d/oferta/'
    for offer in offers:
        url = offer.a['href']
        if url.startswith(olx_offer_pattern):
            url = olx_base_url + url
        # other offers are https://www.otodom.pl
        urls.append(url)
    return urls
    
    
def get_details_from_single_offer(url):
    """get price and geolocation data from single offer"""
    # ******** request ********
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36'}
    res = requests.get(url, headers=headers)
    soup = bs.BeautifulSoup(res.text, 'lxml')
    
    price, latitude, longitude = (0, 0, 0)
    if url.startswith('https://www.olx.pl'):
        # ******** price ********
        price_container = soup.find('div', {'data-testid': "ad-price-container"})
        price = price_container.h3.text
        # you can directly access h3 tag, but it may change in the future
        price = int(''.join(price.rstrip('zł ').split()))
        
        # ******** geolocation ********
        config_script = soup.find('script', {'id': "olx-init-config"})
        config_script_lines = config_script.text.splitlines()
        pattern = 'window.__PRERENDERED_STATE__'
        geo_line = ''
        for line in config_script_lines:
            if line.strip().startswith(pattern):
                geo_line = line
        if not geo_line:
            print('no geo data')
            
        js_variable = geo_line.rstrip(';').split('= ', 1)[1]
        # double json.load is needed; i have no idea why, but it works
        js_var_dict = json.loads(js_variable)
        js_var_dict = json.loads(js_var_dict)
        map_data = js_var_dict['ad']['ad']['map']
        # lat\":50.28828,\"lon\":21.42617
        # example map_data: {'zoom': 12, 'lat': 50.28828, 'lon': 21.42617, 'radius': 6, 'show_detailed': False}
        latitude = map_data.get('lat', 0)
        longitude = map_data.get('lon', 0)
        
    elif url.startswith('https://www.otodom.pl'):
        # ******** price ********
        price = soup.find('strong', {'aria-label': "Cena"}).text
        price = int(''.join(price.rstrip('zł ').split()))
        
        # ******** geolocation ********
        # <script crossorigin="anonymous" id="__NEXT_DATA__" type="application/json">
        # "location":{"id":null,"coordinates":{"latitude":51.12252997811,"longitude":20.621283699079,"__typename":"Coordinates"},"mapDetails":{"radius":0,"zoom":15,"__typename":"MapDetails"}
        config_script = soup.find('script', {'id': "__NEXT_DATA__"})
        js_var_dict = json.loads(config_script.text)
        location = js_var_dict['props']['pageProps']['ad']['location']
        coords = location['coordinates']
        latitude = coords.get('latitude', 0)
        longitude = coords.get('longitude', 0)
        
    else:
        # unknown
        pass
    return price, latitude, longitude
    
    
if __name__ == "__main__":
    # ******** parsing args ********
    version = '0.1.0'
    title = Panel.fit(
        "[blue]olx-advertisments [red]scraper [gold1]version: {}".format(version),
        safe_box=True,
        border_style="green")
    print(title)
    description = 'tool for scraping olx advertisments and show it on map in browser'
    parser = argparse.ArgumentParser(description=description)
    parser.add_argument('olx_url', type=str, help='olx url with flat advertisments')
    args = parser.parse_args()
    olx_url = args.olx_url
    
    # ******** cached data ********
    data_file = Path('templates').joinpath('data.csv')
    try:
        df = pd.read_csv(data_file, index_col=0)
    except FileNotFoundError:
        df = pd.DataFrame(columns=["url", "price", "latitude", "longitude"])
        
    # ******** scraping ********
    total_urls = get_all_offers(olx_url)
    print('total urls number: {}'.format(len(total_urls)))
    df = extract_data_from_ads(total_urls, df)
    df.to_csv(data_file)
    