---
layout: post
title:  "Deploying a Spyre App on Heroku"
date:   2015-04-21 19:21:05
---
This is the first in a series of posts on how to deploy a [Spyre](https://github.com/adamhajari/spyre) web app to a remote server for free or cheap. (If you've never built a Spyre app before, take a look at [the ReadMe](https://github.com/adamhajari/spyre/blob/master/README.md)).  We'll start with one of the free options, Heroku.

Before we dive into things specific to Spyre, I'm going to send you to [a tutorial over at Heroku's dev center] to take care of all of pre-reqs (installing the heroku toolbelt, logging in on your local machine, etc). If you don't already have a Heroku account, you'll need to set that up first. Go through their getting started with python tutorial and when you have a running Heroku App come back here (should only take about 5 minutes).

`...`

Welcome back. That was pretty easy, right? Deploying a Spyre app will be nearly as simple. 
First we need a home for our app. Create a new directory just for your app (it doesn't matter where the directory lives). This directory will contain four files:

- a file that contains the code to run the Spyre app. Let's call it `app.py`
- a file named `Procfile` that tells Heroku how to run your app
- a file named `requirements.txt` that contains a list of most of the python libraries that your app needs to run
- a file named `conda-requirements.txt` that tells heroku it needs to intsll numpy using conda

Go ahead and create `app.py`. In this example we'll be deploying a version of the [slider example] from the [examples directory] in the Spyre Github repo. Here's the code:

{% highlight python %}
from spyre import server

import os
import pandas as pd
import matplotlib.pyplot as plt
import numpy as np
from numpy import pi

class SlidersApp(server.App):
    title = "Decaying Sine Wave"

    inputs =[{ "type":'slider',
                "label": 'Frequency', 
                "min" : 1,
                "max" : 100,
                "value" : 50,
                "key": 'freq', 
                "action_id": 'plot'},
            { "type":'slider',
                "label": 'Decay Rate', 
                "min" : 0,
                "max" : 2,
                "step" : 0.01,
                "value" : 0.5,
                "key": 'decay', 
                "action_id": 'plot'}]

    outputs = [{ "type" : "plot",
                    "id" : "plot" }]

    def getPlot(self, params):
        f = float(params['freq'])
        d = float(params['decay'])
        x = np.arange(0,6*pi,pi/50)
        y1 = np.sin(f*x/(2*pi))
        y2 = np.exp(-x*d)
        y3 = np.sin(f*x/(2*pi))*np.exp(-x*d)
        fig = plt.figure()
        splt1 = fig.add_subplot(3,1,1)
        splt1.plot(x,y1)  # sine wave
        splt1.axes.get_xaxis().set_visible(False)
        splt2 = fig.add_subplot(3,1,2)
        splt2.plot(x,y2)  # exponential decay
        splt2.axes.get_xaxis().set_visible(False)
        splt3 = fig.add_subplot(3,1,3)
        splt3.plot(x,y3)  #sine wave decay
        return fig

if __name__ == '__main__':
    app = SlidersApp()
    app.launch(host='0.0.0.0', port=int(os.environ.get('PORT', '5000')))
{% endhighlight %}

The key line here is 
{% highlight python %}
    app.launch(host='0.0.0.0', port=int(os.environ.get('PORT', '5000')))
{% endhighlight %}
(make sure you `import os` at the top of the script too). Specifying `host='0.0.0.0'` makes your app available across the internet (rather than just locally) and `port=int(os.environ.get('PORT', '5000'))` tells your app which port to launch on. If everything is working correctly you should be able to launch your app from the command line with: 

{% highlight bash %}
$ python app.py
{% endhighlight %}

and see your app running locally at `http://127.0.0.1:5000`

Next, create a file named `Procfile`. This file tells Heroku how to launch your app. For app.py, `Procfile` just needs a single line. 
{% highlight bash %}
web: python app.py
{% endhighlight %}

Now let's make a `requirements.txt` file. This is what Heroku looks at to determine what python libraries your app needs in order to run.

For *most* Heroku apps you just put a list of your app's dependencies in `requirement.txt` and launch your app. However, Heroku builds will timeout after 15 minutes so if your app has dependencies that take longer than that amount of time to install, your build will fail. Spyre depends on numpy (via pandas) and matplotlib, neither of which are quick installs. We can get around this limitation by using the [conda buildpack](https://github.com/kennethreitz/conda-buildpack.git). Add one more file named <i>conda-requirements.txt</i>. This file should contain a single line
{% highlight bash %}
numpy
{% endhighlight %}
 
Your <i>requirements.txt</i> file should contain all of your other requirements. For our example app, our `requirements.txt` file looks like:
{% highlight bash %}
pandas
matplotlib
DataSpyre
{% endhighlight %}

Those are all of the files we need to launch. Now we need to turn the directory where our Spyre app lives into a git repo and commit all of the files in it. Do that by running the following from your app's directory:
{% highlight bash %}
$ git init
$ git add .
$ git commit -am "initial commit for spyre app"
{% endhighlight %}

Now you'll run the heroku create command, and specify where to find the buildpack:
{% highlight bash %}
$ heroku create --buildpack https://github.com/kennethreitz/conda-buildpack.git
{% endhighlight %}
and push your repo up to Heroku:
{% highlight bash %}
$ git push heroku master
{% endhighlight %}

Running `git push heroku master` pushes your code to Heroku's servers and starts the build process for your app. This build is installing numpy so it will take about 5-10 minutes.

Once it finishes, the output will give you a url where you can find your app. you can also type
{% highlight bash %}
$ heroku open
{% endhighlight %}
from the command line to have you app open automatically in a new browser tab.

Heroku will generate a random name for your app which will be part of the url. You can also specify a custom name for your app in the heroku create step
{% highlight bash %}
$ heroku create your-app-name --buildpack https://github.com/kennethreitz/conda-buildpack.git
{% endhighlight %}

If you make any changes to your app just commit and rebuild with 
{% highlight bash %}
$ git commit -am "put a message describing the change here"
$ git push heroku master
{% endhighlight %}


Now share that url with your friends and if you make something awesome, tweet it to @adamhajari!

Be on the look out for future posts about launching Spyre apps on pythonanywhere, digital ocean, and Google Cloud.

<br>
Have a comment or question? [Post it here](https://github.com/adamhajari/adamhajari.github.io/issues/new).
<br><br>

<br><br>
