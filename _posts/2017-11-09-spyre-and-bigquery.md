---
layout: post
title:  "Spyre, Google Cloud, and BigQuery"
date:   2017-11-09 12:00:00
---

This is a follow up post to [yesterday's write up](http://adamhajari.github.io/2017/11/08/deploying-a-spyre-app-on-google-cloud.html) on deploying spyre to Google Cloud. If you haven't read that post yet check it out first and then come back.

In yesterday's post I mentioned that a benefit to deploying to Google Cloud is access to storage engines like BigQuery. In this post we'll walk through steps to incorporate BiqQuery into your spyre apps. Before continuing, walk through the [Big Query quickstart guide](https://cloud.google.com/bigquery/quickstart-web-ui) to ensure that API access to BigQuery is turned on.

We'll be deploying another example from the spyre repo. If you've successfully deployed the sinewave example you should have everything you need to get started. cd to `spyre/tutorial/google_cloud/weatherhistory`. There you'll find a startup script that's very similar to the one we used to deploy the sinewave example. The only real difference is we need to specify the latest pandas version since we'll be using a module not available in older versions.

Also, this time you *will* need to update

{% highlight bash %}
GITHUB_REPO_URL="https://github.com/adamhajari/spyre.git"
{% endhighlight %}


with a link to your forked repo. Unlike the sinewave example, you'll need to make an update to the app's code. Open `weatherhistoryapp.py` and replace the line

{% highlight bash %}
PROJECT_ID = 'spyre-example'
{% endhighlight %}


with your project id. Make sure you commit your change and push it up to your copy of the repo on github.

While you've got `weatherhistoryapp.py` open take a look at the `get_data` method. Here we're using pandas' `read_gbq` method to query BigQuery:

{% highlight bash %}
df = pd.read_gbq(query, project_id=PROJECT_ID, dialect='standard')
{% endhighlight %}


Bigquery provides access to a few publicly available datasets. We're using one of those publicly available tables for our weather history app, but I encourage you to try [loading your own data into bigquery](https://cloud.google.com/bigquery/docs/loading-data).

When running this script on a Google Compute Engine instance, all of the authentication/authorization is done automatically. You can also run this locally, but you may need to run this SDK command from the command line first:

{% highlight bash %}
$ gcloud auth application-default login
{% endhighlight %}


Additionally, the first time you run the app you may be directed to an authentication page in your browser. Just following the instructions in your terminal window and you'll be up and running in a matter of seconds.

Finally, when we create our instance we'll need to specify that we want our instance to have access to the the BigQuery API. You can do this with the SDK tool with the `--scopes` argument. Here's the full command:

{% highlight bash %}
gcloud compute instances create weatherhistory \
     --image-family=debian-8 \
     --image-project=debian-cloud \
     --machine-type=f1-micro \
     --metadata-from-file startup-script=startup-script.sh \
     --zone us-east1-b \
     --tags http-server \
     --scopes=default,bigquery \
     --project=[PROJECT_ID]
{% endhighlight %}

(don't forget to replace [PROJECT_ID] with your project id). You can also add API access when creating an instance from the web console under `Identity and API access` by checking the `Set access for each API` button and setting `BigQuery` to `Enabled`.

If your deploying to the same project id that you used to deploy the sinewave app, http access to port 8080 should already be open. If this is a new project, run the gcloud command to open that port:

{% highlight bash %}
gcloud compute firewall-rules create default-allow-http-8080 \
    --allow tcp:8080 \
    --source-ranges 0.0.0.0/0 \
    --target-tags http-server \
    --description "Allow port 8080 access to http-server" \
    --project=[PROJECT_ID]
{% endhighlight %}


After a few minutes you should be able to access your app on port 8080 at the instance's external IP address. If you need to troubleshoot, remember that you can view your app's logs from the Compute Engine's web console.

<br>
Have a comment or question? [Post it here](https://github.com/adamhajari/adamhajari.github.io/issues/new).
<br><br>