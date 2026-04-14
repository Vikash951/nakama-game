# Use the official Nakama image as the base
FROM registry.heroiclabs.com/heroiclabs/nakama:3.22.0

# Copy our game module into the image
COPY modules/ /nakama/data/modules/

# Copy and prepare the startup script
COPY start.sh /nakama/start.sh

# No need to switch users; run start.sh directly via sh to avoid permission issues
ENTRYPOINT ["sh", "/nakama/start.sh"]
