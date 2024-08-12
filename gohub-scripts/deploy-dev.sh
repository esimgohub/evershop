#!/bin/bash -e

aws ecr get-login-password --region ap-southeast-1 | docker login --username AWS --password-stdin 533910826927.dkr.ecr.ap-southeast-1.amazonaws.com

# need cd to evershop project folder
docker compose -f docker-compose.dev.yml up -d --pull always