#!/usr/bin/env bash

#
# This script installs the development environment.
#

# Require all variables to be set and exit on first error.
set -u
set -e

LOG='/vagrant/provisioning/provisioning.log'

POSTGRES_CONFIG='/etc/postgresql/9.4/main/pg_hba.conf'

# Clear the log
> $LOG

# A quiet unattended installation
export DEBIAN_FRONTEND=noninteractive

echo 'Now provisioning! Why not get a coffee?'
echo "Output and errors are logged into ${LOG}."

echo 'Configuring the system...'

# Set a proper locale
echo 'LC_ALL="en_US.UTF-8"' | sudo tee -a /etc/environment > /dev/null

echo 'Upgrading the system...'

sudo apt-get -qy update &>> $LOG
sudo apt-get -qy upgrade &>> $LOG

echo 'Installing Postgres...'

sudo apt-get -qy install postgresql postgresql-contrib libpq-dev &>> $LOG

echo 'Installing Node.js...'

curl -sL https://deb.nodesource.com/setup_4.x | sudo -E bash - &>> $LOG
sudo apt-get install -qy nodejs &>> $LOG

# Allow login from anywhere
sudo sed -Ei \
  's/local\s+all\s+postgres\s+peer/local all postgres trust/' $POSTGRES_CONFIG

sudo service postgresql restart &>> $LOG

echo 'Setting up database...'

DB_ERROR='...createdb failed, skipping. Does the database exist already?'

sudo -u postgres createdb development &>> $LOG || echo $DB_ERROR

echo 'Done!'