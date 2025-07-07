FROM nginx:alpine

COPY index.html /usr/share/nginx/html/index.html
COPY tests.js /usr/share/nginx/html/tests.js
COPY css/ /usr/share/nginx/html/css/
COPY js/ /usr/share/nginx/html/js/

RUN sed -i 's/\<80\>/8080/g' /etc/nginx/conf.d/default.conf

