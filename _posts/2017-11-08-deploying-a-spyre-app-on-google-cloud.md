---
layout: post
title:  "Deploying a Spyre App on Google Cloud"
date:   2017-11-08 12:00:00
---

Google Cloud Compute and Amazon Web Services offer cloud resources that make it easy to scale an application to as many machines as a project needs. This ease comes at a price ($$$) and, at first glance, both platforms seem overkill for launching a simple spyre app. However, Google offers a free/affordable tier for their smallest unit of compute power. 1 micro instance running continuously is free, and each additional micro instance is about $4 a month (though it's billed by the hour so you only pay for what you use).

Micro instances give you 600MB of RAM so it's not a lot to work with. The upside is that Google's data wharehouse/query engine, BigQuery, also has a free tier. With data stored in BigQuery, a micro instance will probably be sufficient for a small to medium sized project.

Before getting started with this tutorial work through Google's [hello world example](https://cloud.google.com/python/getting-started/hello-world#deploy_and_run_hello_world_on_app_engine) to get familiar with creating a project and working with the Google Cloud SDK (if you can't get the SDK working, don't worry, there's a work around). 

The Hello World example uses the Google Cloud App Engine. This comes in two flavors, standard and flex. Standard has a free tier, but doesn't support pandas (and thus won't work for spyre). As the name implies, Flex allows for more flexibility put is too pricey for our purposes. Instead we'll be working with Google's Compute Engine instances. These provide more flexibility than the Standard App Engines, but at a reasonable price.

We'll be deploying one of the example apps from the [spyre github repo](https://github.com/adamhajari/spyre/). Fork your own copy of the repo and clone it to your local machine. cd into the `tutorial/google_cloud/sinewave/` [directory](https://github.com/adamhajari/spyre/tree/master/tutorial/google_cloud/sinewave). There should be four files there:

1. A README
2. A requirements.txt file specifying our app's dependencies
3. The app code (sinewaveapp.py)
4. A startup script (startup-script.sh)

Most of the work of getting our app running is done by the startup script (which heavily borrowed from the [bookshelf example](https://cloud.google.com/python/tutorials/bookshelf-on-compute-engine)) so let's walk through it.

## startup script overview
Everything should work if you leave `GITHUB_REPO_URL` as-is, but if you want to make any tweaks, you should replace with your forked repo:

{% highlight bash %}
GITHUB_REPO_URL="https://github.com/adamhajari/spyre.git"
{% endhighlight %}

These two lines will make any logs sent to syslog available from the Google Compute Engine web console:

{% highlight bash %}
curl -s "https://storage.googleapis.com/signals-agents/logging/google-fluentd-install.sh" | bash
service google-fluentd restart &
{% endhighlight %}

For security purposes, we'll create a new user with non-root privileges and run our app as that user:

{% highlight bash %}
useradd -m -d /home/pythonapp pythonapp
{% endhighlight %}

The instance doesn't come with much installed so we'll need to download and install all of the required tools ourselves. For non-scientific python apps we could install everything with `apt-get` and `pip`, but spyre apps require numpy, pandas, and matplotlib. While these libraries are available via apt-get/pip, I've found that installing that way on a micro instance often results in Out of Memory errors. Instead, we'll get those scientific dependencies by installing a miniconda distribution of Python.

{% highlight bash %}
apt-get update
apt-get install -yq git build-essential supervisor libffi-dev libssl-dev

#Download and install the miniconda distribution of python
wget https://repo.continuum.io/miniconda/Miniconda-latest-Linux-x86_64.sh -O /home/pythonapp/miniconda.sh;
bash /home/pythonapp/miniconda.sh -b -p /home/pythonapp/miniconda
chown -R pythonapp:pythonapp /home/pythonapp/miniconda/
{% endhighlight %}

Clone a copy of the spyre repo to your instance:

{% highlight bash %}
export HOME=/root
git clone $GITHUB_REPO_URL /opt/app
{% endhighlight %}

Create a virtualenv and install all of the required dependencies from the requirements.txt file:

{% highlight bash %}
export PATH="/home/pythonapp/miniconda/bin:$PATH"
hash -r
conda config --set always_yes yes --set changeps1 no
conda update -q conda
conda info -a
conda create -q -n app-env python=2.7 numpy matplotlib pandas

/home/pythonapp/miniconda/envs/app-env/bin/pip install -r /opt/app/tutorial/google_cloud/sinewave/requirements.txt
{% endhighlight %}

Note that we installed the scientific dependencies first from conda. Everything else can be installed from the requirements.txt file.

We'll run our app using Supervisor which will automatically start the app if the machine is ever restarted and restart the app if it dies. These lines create a Supervisor config file which tells Supervisor how to run the app:

{% highlight bash %}
cat >/etc/supervisor/conf.d/python-app.conf << EOF
[program:spyreexample]
directory=/opt/app/tutorial/google_cloud/sinewave
command=/home/pythonapp/miniconda/envs/app-env/bin/python2.7 /opt/app/tutorial/google_cloud/sinewave/sinewaveapp.py 0.0.0.0 8080
autostart=true
autorestart=true
user=pythonapp
# Environment variables ensure that the application runs inside of the configured virtualenv.
environment=VIRTUAL_ENV="/home/pythonapp/miniconda/envs/app-env/",PATH="/opt/app/tutorial/google_cloud/sinewave/env/bin",\
    HOME="/home/pythonapp",USER="root"
stdout_logfile=syslog
stderr_logfile=syslog
EOF
{% endhighlight %}

Note that the command that we're telling Supervisor to run

{% highlight bash %}
command=/home/pythonapp/miniconda/envs/app-env/bin/python2.7 /opt/app/tutorial/google_cloud/sinewave/sinewaveapp.py 0.0.0.0 8080
{% endhighlight %}

is running python from the `app-env/bin` directory. This is the directory for our virtualenv and is where all of our dependencies got installed. Also note that we're passing to arguments the sinewaveapp.py. If you take a look at the code you'll see that the first arg is the host and the second is the port. Host 0.0.0.0 is what we need to make our app available at this machine's IP address. We'll have to manually open port 8080, which we'll do in a second.

Finally, register the config with Supervisor and have it start running the app:


{% highlight bash %}
supervisorctl reread
supervisorctl update
{% endhighlight %}

Note that you could run all of these commands from a terminal shell (you'd have to run most with sudo), but including them in a startup script means that everything that needs to happen to get your app running happens automatically every time you create a new instance.

## Creating an instance

You can create your instance from the command line using the Google Compute SDK by running the following command from the directory where `startup-script.sh` is located:

{% highlight bash %}
gcloud compute instances create [INSTANCE-NAME] \
    --image-family=debian-8 \
    --image-project=debian-cloud \
    --machine-type=f1-micro \
    --metadata-from-file startup-script=startup-script.sh \
    --zone us-east1-b \
    --tags http-server \
    --project=[PROJECT_ID]
{% endhighlight %}

replacing [INSTANCE-NAME] with a name for your instance (you can call it anything), and [PROJECT_ID] with the project id for an existing project (You can use the same one you used the hello world example or create a new one). The command should finish running in a few seconds and you'll get an output giving some details about your instance:

{% highlight bash %}
$ gcloud compute instances create sinewaveapp \
>     --image-family=debian-8 \
>     --image-project=debian-cloud \
>     --machine-type=f1-micro \
>     --metadata-from-file startup-script=startup-script.sh \
>     --zone us-east1-b \
>     --tags http-server \
>     --project=spyre-example
Created [https://www.googleapis.com/compute/v1/projects/spyre-example/zones/us-east1-b/instances/sinewaveapp].
NAME         ZONE        MACHINE_TYPE  PREEMPTIBLE  INTERNAL_IP  EXTERNAL_IP    STATUS
sinewaveapp  us-east1-b  f1-micro                   10.142.0.4   35.190.191.17  RUNNING
{% endhighlight %}

If you are having trouble with the Google Compute SDK, you can also create an instance from the [Google Compute Engine web console](https://console.cloud.google.com/compute/instancesAdd). Just make sure the machine type, boot disk match what's above and copy and past the contents of `startup-script.sh` to the startup script text box.

## Making your instance available to external traffic
It will take several minutes for our app to install everything and start running. In the meantime we'll need to open up port 8080 to external traffic. Do so by running this command (replacing [PROJECT_ID] with your project id):

{% highlight bash %}
gcloud compute firewall-rules create default-allow-http-8080 \
    --allow tcp:8080 \
    --source-ranges 0.0.0.0/0 \
    --target-tags http-server \
    --description "Allow port 8080 access to http-server" \
    --project=[PROJECT_ID]
{% endhighlight %}

If you choose to launch your app from the web console you don't need to do this extra step. Instead, make sure to check the "Allow HTTP traffic" box when creating your instance.


You should now see your instance in the Compute Engine web console. You can open a terminal window for your instance directly in the browser from the `SSH` drop down menu. View your instance's logs by clicking the three vertical dots to the left of the `SSH` drop down.

If all goes well you can access your app by browsing to [ExternalIP]:8080. For instance, my External IP was 35.190.191.17, so my app is available at http://35.190.191.17:8080.

<br><br>