# Use the official Nakama image as the base
FROM registry.heroiclabs.com/heroiclabs/nakama:3.22.0

# Copy our game module into the image
COPY modules/ /nakama/data/modules/

# Copy and prepare the startup script
COPY start.sh /nakama/start.sh

# Switch to root briefly to set permissions, then back to nakama user
USER root
RUN chmod +x /nakama/start.sh
USER nakama

# Expose the Nakama socket API port
EXPOSE 7350

ENTRYPOINT ["/nakama/start.sh"]
