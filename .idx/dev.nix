{ pkgs, ... }: {
  # The channel determines which package versions are available.
  channel = "stable-24.05"; # or "unstable"

  # A list of packages to install from the specified channel.
  packages = [
    pkgs.nodejs_20
    pkgs.postgresql_16 # For the test database
  ];

  # A set of environment variables to define within the workspace.
  env = {
    # DATABASE_URL for development, TEST_DATABASE_URL for testing
    DATABASE_URL = "postgres://postgres:postgres@localhost:5432/postgres";
    TEST_DATABASE_URL = "postgres://postgres:postgres@localhost:5432/testdb";
  };

  # A list of VS Code extensions to install from the Open VSX Registry.
  idx = {
    extensions = [
      "ms-vscode.vscode-typescript-next"
      "dbaeumer.vscode-eslint"
    ];

    # Workspace lifecycle hooks.
    workspace = {
      # Runs when a workspace is first created.
      onCreate = {
        # Install npm dependencies
        npm-install = "cd backend && npm install";
        # Install supertest for integration testing
        supertest-install = "cd backend && npm install --save-dev supertest @types/supertest";
        # Initialize postgresql and create test database
        init-db = ''
          export PGDATA=$PWD/.postgres/data
          if [ ! -d "$PGDATA" ]; then
            initdb -D $PGDATA
            pg_ctl -D $PGDATA -l logfile start
            createdb testdb
            pg_ctl -D $PGDATA stop
          fi
        '';
      };

      # Runs every time the workspace is (re)started.
      onStart = {
        # Start the postgresql server
        postgres-start = "export PGDATA=$PWD/.postgres/data && pg_ctl -D $PGDATA -l logfile start";
      };
    };

    # Configure a web preview for your application.
    previews = {
      enable = true;
      previews = {
        web = {
          command = [ "npm" "run" "start:dev" "--" "--prefix" "backend" ];
          manager = "web";
        };
      };
    };
  };
}
