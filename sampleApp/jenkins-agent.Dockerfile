FROM jenkins/inbound-agent:latest

USER root

# Install dependencies
RUN apt-get update && apt-get install -y \
    curl \
    git \
    docker.io \
    sudo \
    && rm -rf /var/lib/apt/lists/*

# Install kubectl
RUN curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl" \
    && chmod +x kubectl \
    && mv kubectl /usr/local/bin/

# Install .NET SDK (important for your project)
RUN apt-get update && apt-get install -y wget \
    && wget https://packages.microsoft.com/config/ubuntu/22.04/packages-microsoft-prod.deb \
    && dpkg -i packages-microsoft-prod.deb \
    && apt-get update \
    && apt-get install -y dotnet-sdk-10.0

USER jenkins
