# olx-scraper
olx flats for rent advertisments scraper. For educational purposes only

## install

```
git clone https://github.com/redorb/olx-scraper
python -m venv venv
.\venv\Scripts\Activate.ps1  # on windows
source venv/bin/activate  # on linux
```

dependencies
```
pip install -r requirements.txt
```

alternatively you can install type:

```
pip install lxml requests pandas rich beautifulsoup4 Flask
```

## usage

run cli app

```
python olx_offers.py <olx-url>
# example
python olx_offers.py "https://www.olx.pl/d/nieruchomosci/mieszkania/wynajem/sosnowiec/"
```

run flask app

```
# https://flask.palletsprojects.com/en/1.1.x/cli/

# Unix Bash
export FLASK_APP=hello
flask run

# Windows CMD:
set FLASK_APP=app
flask run

# Windows PowerShell:
$env:FLASK_APP = "app"
flask run
```

open link in browser

```
http://127.0.0.1:5000/
```


## few comments, FAQ

 - dont ask my why OpenStreetMaps files are static. I have no idea
 - don't ask my why style.css is inside static/theme/default. Have no idea too
 - why it requests each url one by one? because it was easier to develop. It could be fixed using asyncio or threading
 - can you feed olx url from browser, not from commandline? if any develop will be made I will do it
