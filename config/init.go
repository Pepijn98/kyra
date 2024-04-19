package config

type Author struct {
	Email string `json:"email"`
	Name  string `json:"name"`
	Url   string `json:"url"`
}

type AppInfo struct {
	Name     string `json:"name"`
	Version  string `json:"version"`
	Homepage string `json:"homepage"`
	Bugs     string `json:"bugs"`
	Author   Author `json:"author"`
}

type ApplicationConfig struct {
	Host      string  `json:"host"`
	JWTSecret string  `json:"jwt_secret"`
	App       AppInfo `json:"app"`
}

var Config *ApplicationConfig

func Init(host string, jwt_secret string) {
	Config = &ApplicationConfig{
		Host:      host,
		JWTSecret: jwt_secret,
		App: AppInfo{
			Name:     "kyra-api",
			Version:  "v2",
			Homepage: "https://github.com/Pepijn98/kyra#readme",
			Bugs:     "https://github.com/Pepijn98/kyra/issues",
			Author: Author{
				Email: "pepijn@vdbroek.dev",
				Name:  "Pepijn van den Broek",
				Url:   "https://vdbroek.dev",
			},
		},
	}
}
