# The marketing site is hand-written HTML with no build step, so it never
# enters the Node image the tuner needs. `site/` is its own Dokploy app for
# exactly this reason: a red `npm run build` in the tuner must not block a fix
# to the privacy policy, which is a link registered with two app stores.
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY . /usr/share/nginx/html
RUN rm -f /usr/share/nginx/html/Dockerfile /usr/share/nginx/html/nginx.conf
EXPOSE 80
