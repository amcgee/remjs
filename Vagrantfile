# -*- mode: ruby -*-
# vi: set ft=ruby :

# Vagrantfile API/syntax version. Don't touch unless you know what you're doing!
VAGRANTFILE_API_VERSION = "2"

Vagrant.configure(VAGRANTFILE_API_VERSION) do |config|
  config.vm.box = "hashicorp/precise64"

  # config.vm.box_check_update = false

  config.vm.network "forwarded_port", guest: 2083, host: 2083
  config.vm.network "forwarded_port", guest: 2086, host: 2086

  config.vm.provision "shell", path: "automation/provision.sh"

end
