
[CmdletBinding()]
param(
	[ValidateSet('WatchTypedoc', '')]
	[string]$JobType = 'WatchTypedoc'

)


switch ($JobType) {
	# 监控src目录,自动生成文档
	'WatchTypedoc' {
		watchexec.exe -w src --restart --clear  --exts ts  pnpm typedoc:gen
	}
	Default {
		Write-Host 'Please choose a Job Type'
	}
}



