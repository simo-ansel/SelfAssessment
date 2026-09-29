FROM php:8.2-apache

# Driver MySQL per PDO, riscrittura degli URL e intestazioni HTTP personalizzate
RUN docker-php-ext-install pdo_mysql && a2enmod rewrite headers

COPY 000-default.conf /etc/apache2/sites-available/000-default.conf
