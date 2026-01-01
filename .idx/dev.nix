{ pkgs, ... }: {
  channel = "stable-24.05"; 

  packages = [ pkgs.postgresql_16 ];

  # BURASI EKLENDİ: Terminal ve uygulamanın DB'yi nerede bulacağını bilmesi için
  env = {
    PGHOST = "127.0.0.1";
    PGPORT = "5432";
    PGUSER = "user"; # IDX varsayılan kullanıcısı
    PGDATABASE = "sorio";
  };

  idx = {
    extensions = [ "google.gemini-cli-vscode-ide-companion" ];

    workspace = {
      onCreate = {
        default.openFiles = [ ".idx/dev.nix" "README.md" ];
      };
      
      onStart = {
        start-postgres = ''
          # Klasör yoksa oluştur (DB ilk kurulumu)
          if [ ! -d ".data/postgres" ]; then
            initdb -D .data/postgres
            
            # Şifresiz yerel bağlantıya izin ver
            echo "host all all 127.0.0.1/32 trust" >> .data/postgres/pg_hba.conf
            echo "host all all ::1/128 trust" >> .data/postgres/pg_hba.conf
            
            # BURASI EKLENDİ: Postgres'in TCP üzerinden dinlediğinden emin ol
            echo "listen_addresses = '*'" >> .data/postgres/postgresql.conf
            echo "port = 5432" >> .data/postgres/postgresql.conf
          fi

          # Sunucuyu başlat ve hazır olmasını bekle
          # -l logfile: Hataları görmek için log dosyası oluşturur
          pg_ctl -D .data/postgres -l .data/postgres/logfile -o "-k /tmp" start

          # Veritabanını oluştur (hata verirse yoksay - zaten varsa)
          createdb sorio || true
        '';
      };
    };
  };
}