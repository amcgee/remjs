# -*- mode: ruby -*-
# vi: set ft=ruby :

# Vagrantfile API/syntax version. Don't touch unless you know what you're doing!
VAGRANTFILE_API_VERSION = "2"

Vagrant.configure(VAGRANTFILE_API_VERSION) do |config|
  config.vm.box = "hashicorp/precise64"

  # config.vm.box_check_update = false

  # MongoDB
  config.vm.network "forwarded_port", guest: 27017, host: 27017

  config.vm.provision "shell", path: "automation/provision.sh"

end
